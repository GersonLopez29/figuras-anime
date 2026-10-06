import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/session";
import { consignmentStatusSchema } from "@/lib/consignment";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  if (!isAdmin(currentUser)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const parsed = consignmentStatusSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  const existing = await prisma.consignmentRequest.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });
  }

  const updated = await prisma.consignmentRequest.update({
    where: { id },
    data: { status: parsed.data.status },
    select: { id: true, status: true },
  });
  return NextResponse.json(updated);
}
