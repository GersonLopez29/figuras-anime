import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/session";
import { FEATURE_DAYS, FEATURE_PRICE, extendFeaturedUntil } from "@/lib/featured";
import { sendFeatureRequestAdminEmail } from "@/lib/email";

// El vendedor avisa que pagó por Yape/Plin para destacar su figura. Queda
// pendiente hasta que el admin confirme el pago en /admin/destacados. Si quien
// la pide es el propio admin (su tienda), se destaca al instante sin pago.
export async function POST(
  _request: NextRequest,
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
