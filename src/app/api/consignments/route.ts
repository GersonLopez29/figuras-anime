import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { CONSIGNMENT_DAILY_LIMIT, consignmentRequestSchema } from "@/lib/consignment";
import { sendConsignmentRequestAdminEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  }
  if (!user.emailVerified) {
    return NextResponse.json(
      { error: "Verifica tu correo antes de enviar una solicitud" },
      { status: 403 }
    );
  }

  const parsed = consignmentRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recent = await prisma.consignmentRequest.count({
    where: { userId: user.id, createdAt: { gte: since } },
  });
  if (recent >= CONSIGNMENT_DAILY_LIMIT) {
    return NextResponse.json(
      { error: "Ya enviaste varias solicitudes hoy. Te escribiremos pronto por WhatsApp." },
      { status: 429 }
    );
  }

  await prisma.consignmentRequest.create({
    data: { ...parsed.data, userId: user.id },
  });
  await sendConsignmentRequestAdminEmail(
    user.name,
    user.whatsapp,
    parsed.data.figure,
    parsed.data.details,
    parsed.data.expectedPrice
  );

  return NextResponse.json({ ok: true }, { status: 201 });
}
