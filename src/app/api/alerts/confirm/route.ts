import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const schema = z.object({ token: z.string().min(10).max(100) });

// Activa un aviso desde el botón de /avisame/confirmar (no al abrir el enlace,
// porque algunos filtros de correo abren los enlaces solos).
export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enlace inválido" }, { status: 400 });
  }
  const now = new Date();
  const updated = await prisma.stockAlert.updateMany({
    where: { token: parsed.data.token },
    // Los 6 meses del aviso cuentan desde que se activa.
    data: { confirmedAt: now, createdAt: now },
  });
  if (updated.count === 0) {
    return NextResponse.json({ error: "Este aviso ya no existe" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
