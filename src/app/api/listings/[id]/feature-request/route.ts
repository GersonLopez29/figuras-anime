import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/session";
import { FEATURE_DAYS, FEATURE_PRICE, extendFeaturedUntil } from "@/lib/featured";
import { sendFeatureRequestAdminEmail } from "@/lib/email";

// El vendedor avisa que pagó por Yape/Plin para destacar su figura. Queda
// pendiente hasta que el admin confirme el pago en /admin/destacados. Si quien
// la pide es el propio admin (su tienda), se destaca al instante sin pago.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  }

  const listing = await prisma.listing.findUnique({
    where: { id },
    select: { id: true, title: true, userId: true, sold: true, featuredUntil: true },
  });
  if (!listing) {
    return NextResponse.json({ error: "Publicación no encontrada" }, { status: 404 });
  }
  if (listing.userId !== user.id) {
    return NextResponse.json({ error: "Solo puedes destacar tus propias figuras" }, { status: 403 });
  }
  if (listing.sold) {
    return NextResponse.json({ error: "Esta figura ya fue vendida" }, { status: 400 });
  }

  const pending = await prisma.featureRequest.findFirst({
    where: { listingId: id, status: "pending" },
    select: { id: true },
  });
  if (pending) {
    return NextResponse.json(
      { error: "Ya tienes una solicitud pendiente para esta figura" },
      { status: 409 }
    );
  }

  // Destacado gratis ganado invitando amigos: se aplica al instante.
  const body = await request.json().catch(() => null);
  if (body?.useCredit === true) {
    // Todo en una transacción: si algo falla, el destacado gratis no se pierde.
    const featuredUntil = await prisma.$transaction(async (tx) => {
      const spent = await tx.user.updateMany({
        where: { id: user.id, freeFeatureCredits: { gt: 0 } },
        data: { freeFeatureCredits: { decrement: 1 } },
      });
      if (spent.count !== 1) return null;
      // Bloquea la fila para que dos usos simultáneos sumen los días uno tras otro.
      await tx.$queryRaw`SELECT id FROM "Listing" WHERE id = ${id} FOR UPDATE`;
      const current = await tx.listing.findUnique({ where: { id }, select: { featuredUntil: true } });
      const until = extendFeaturedUntil(current?.featuredUntil ?? null, FEATURE_DAYS);
      await tx.featureRequest.create({
        data: {
          listingId: id,
          userId: user.id,
          amount: 0,
          days: FEATURE_DAYS,
          status: "approved",
          resolvedAt: new Date(),
        },
      });
      await tx.listing.update({ where: { id }, data: { featuredUntil: until } });
      return until;
    });
    if (!featuredUntil) {
      return NextResponse.json({ error: "No tienes destacados gratis disponibles" }, { status: 400 });
    }
    return NextResponse.json({ status: "approved", featuredUntil }, { status: 201 });
  }

  if (isAdmin(user)) {
    const featuredUntil = extendFeaturedUntil(listing.featuredUntil, FEATURE_DAYS);
    await prisma.$transaction([
      prisma.featureRequest.create({
        data: {
          listingId: id,
          userId: user.id,
          amount: 0,
          days: FEATURE_DAYS,
          status: "approved",
          resolvedAt: new Date(),
        },
      }),
      prisma.listing.update({ where: { id }, data: { featuredUntil } }),
    ]);
    return NextResponse.json({ status: "approved", featuredUntil }, { status: 201 });
  }

  await prisma.featureRequest.create({
    data: { listingId: id, userId: user.id, amount: FEATURE_PRICE, days: FEATURE_DAYS },
  });
  await sendFeatureRequestAdminEmail(user.name, listing.title, FEATURE_PRICE);

  return NextResponse.json({ status: "pending" }, { status: 201 });
}
