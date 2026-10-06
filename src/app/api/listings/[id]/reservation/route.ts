import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/session";
import { getActiveDiscountAmount, getFinalPrice } from "@/lib/format";
import {
  MAX_RESERVATION_DAYS,
  dateInputToEndOfDayLima,
  reservationSchema,
} from "@/lib/reservation";

// Marca o quita "Separada" en una figura. amount: null la quita.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  }

  const existing = await prisma.listing.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Publicación no encontrada" }, { status: 404 });
  }
  if (existing.userId !== user.id && !isAdmin(user)) {
    return NextResponse.json({ error: "No puedes modificar esta publicación" }, { status: 403 });
  }

  const parsed = reservationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { amount, until } = parsed.data;

  if (amount === null) {
    const updated = await prisma.listing.update({
      where: { id },
      data: { reservedAmount: null, reservedUntil: null },
    });
    return NextResponse.json(updated);
  }

  if (existing.sold) {
    return NextResponse.json({ error: "Esta figura ya fue vendida" }, { status: 400 });
  }

  const finalPrice = getFinalPrice(
    existing.price,
    getActiveDiscountAmount(existing.discountAmount, existing.discountExpiresAt)
  );
  if (amount >= finalPrice) {
    return NextResponse.json(
      { error: "El adelanto debe ser menor que el precio. Si ya pagó todo, márcala como vendida." },
      { status: 400 }
    );
  }

  let reservedUntil: Date | null = null;
  if (until) {
    reservedUntil = dateInputToEndOfDayLima(until);
    const now = Date.now();
    if (Number.isNaN(reservedUntil.getTime()) || reservedUntil.getTime() <= now) {
      return NextResponse.json({ error: "La fecha límite debe ser hoy o una fecha futura" }, { status: 400 });
    }
    if (reservedUntil.getTime() > now + MAX_RESERVATION_DAYS * 24 * 60 * 60 * 1000) {
      return NextResponse.json(
        { error: `La separación puede durar como máximo ${MAX_RESERVATION_DAYS} días` },
        { status: 400 }
      );
    }
  }

  const updated = await prisma.listing.update({
    where: { id },
    data: { reservedAmount: amount, reservedUntil },
  });
  return NextResponse.json(updated);
}
