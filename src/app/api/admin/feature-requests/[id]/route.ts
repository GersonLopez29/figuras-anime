import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/session";
import { extendFeaturedUntil, formatShortDate } from "@/lib/featured";
import { sendFeatureRequestResolvedEmail } from "@/lib/email";
import { listingPath } from "@/lib/slug";

const schema = z.object({ action: z.enum(["approve", "reject"]) });

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  if (!isAdmin(currentUser)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
  }

  const featureRequest = await prisma.featureRequest.findUnique({
    where: { id },
    include: {
      listing: { select: { id: true, slug: true, title: true, featuredUntil: true } },
      user: { select: { name: true, email: true } },
    },
  });
  if (!featureRequest) {
    return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });
  }
  if (featureRequest.status !== "pending") {
    return NextResponse.json({ error: "Esta solicitud ya fue resuelta" }, { status: 409 });
  }

  const { listing, user } = featureRequest;

  if (parsed.data.action === "reject") {
    await prisma.featureRequest.update({
      where: { id },
      data: { status: "rejected", resolvedAt: new Date() },
    });
    await sendFeatureRequestResolvedEmail(user.email, user.name, listing.title, listingPath(listing), false);
    return NextResponse.json({ status: "rejected" });
  }

  const featuredUntil = extendFeaturedUntil(listing.featuredUntil, featureRequest.days);
  await prisma.$transaction([
    prisma.featureRequest.update({
      where: { id },
      data: { status: "approved", resolvedAt: new Date() },
    }),
    prisma.listing.update({ where: { id: listing.id }, data: { featuredUntil } }),
  ]);
  await sendFeatureRequestResolvedEmail(
    user.email,
    user.name,
    listing.title,
    listingPath(listing),
    true,
    formatShortDate(featuredUntil)
  );

  return NextResponse.json({ status: "approved", featuredUntil });
}
