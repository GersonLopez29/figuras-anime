import { NextRequest, NextResponse, after } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/session";
import { claimSalesMilestones } from "@/lib/sellerRewards";
import { sendSalesMilestoneEmail } from "@/lib/email";
import { FEATURE_DAYS } from "@/lib/featured";

const soldSchema = z.object({ sold: z.boolean() });

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
  const parsed = soldSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  const updated = await prisma.listing.update({
    where: { id },
    data: {
      sold: parsed.data.sold,
      // Guarda cuándo se vendió (para "Vendidas hace poco"). Si ya estaba
      // vendida se conserva la fecha original; al volver a disponible se borra.
      soldAt: parsed.data.sold ? (existing.sold ? (existing.soldAt ?? new Date()) : new Date()) : null,
    },
  });

  // Logros por ventas (1, 5 y 10): al marcar una venta nueva se revisa si el
  // vendedor llegó a uno y se le entrega su destacado gratis.
  if (parsed.data.sold && !existing.sold) {
    const sellerId = existing.userId;
    after(async () => {
      try {
        const reached = await claimSalesMilestones(sellerId);
        if (reached.length === 0) return;
        const seller = await prisma.user.findUnique({
          where: { id: sellerId },
          select: { email: true, name: true },
        });
        if (seller) await sendSalesMilestoneEmail(seller.email, seller.name, reached, FEATURE_DAYS);
      } catch (err) {
        console.error("[logros] No se pudo revisar los logros de ventas:", err);
      }
    });
  }

  return NextResponse.json(updated);
}
