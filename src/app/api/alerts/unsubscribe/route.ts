import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const schema = z.object({ token: z.string().min(10).max(100) });

// Dar de baja un aviso desde el enlace del correo (con botón, para que los
// filtros de correo que abren enlaces solos no lo borren sin querer).
export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enlace inválido" }, { status: 400 });
  }
  await prisma.stockAlert.deleteMany({ where: { token: parsed.data.token } });
  return NextResponse.json({ ok: true });
}
