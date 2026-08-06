import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/session";
import { DISCOUNT_DURATION_MS } from "@/lib/format";

const discountSchema = z.object({
  discountAmount: z.number().positive("Ingresa un monto de descuento válido").nullable(),
});

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
    return NextResponse.json(
      { error: "No puedes modificar esta publicación" },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = discountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  if (parsed.data.discountAmount !== null && parsed.data.discountAmount >= existing.price) {
    return NextResponse.json(
      { error: "El descuento no puede ser mayor o igual al precio de la figura" },
      { status: 400 }
    );
  }

  const updated = await prisma.listing.update({
    where: { id },
    data: {
      discountAmount: parsed.data.discountAmount,
      discountExpiresAt: parsed.data.discountAmount
        ? new Date(Date.now() + DISCOUNT_DURATION_MS)
        : null,
    },
  });

  return NextResponse.json(updated);
}
