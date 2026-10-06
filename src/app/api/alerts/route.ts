import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { getClientIp } from "@/lib/requestIp";
import { normalizeAlertQuery } from "@/lib/alertMatch";
import { sendAlertConfirmEmail } from "@/lib/email";

const MAX_ATTEMPTS_PER_IP = 8;
const WINDOW_MINUTES = 60;
// Avisos activos (confirmados) por correo.
const MAX_ALERTS_PER_EMAIL = 20;
// Avisos sin confirmar por correo: así nadie puede llenar de correos de
// confirmación la bandeja de otra persona.
const MAX_UNCONFIRMED_PER_EMAIL = 3;
// Un aviso sin confirmar se borra a las 48 h, y su correo de confirmación no
// se reenvía antes de 24 h.
const UNCONFIRMED_TTL_HOURS = 48;
const CONFIRM_RESEND_HOURS = 24;

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Escribe un correo válido"),
  query: z
    .string()
    .trim()
    .min(2, "Escribe qué figura o personaje buscas")
    .max(80, "Escribe algo más corto"),
});

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

// "Avísame cuando llegue". Responde igual exista o no el aviso, para no revelar
// qué correos tienen avisos. El aviso se activa al confirmar el correo, salvo
// que sea el correo ya verificado de quien tiene la sesión abierta.
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  // Primero se registra el intento y después se cuenta: así varias peticiones
  // simultáneas no pasan todas el límite.
  await prisma.alertAttempt.create({ data: { ip } });
  const attempts = await prisma.alertAttempt.count({
    where: { ip, createdAt: { gte: new Date(Date.now() - WINDOW_MINUTES * 60_000) } },
  });
  if (attempts > MAX_ATTEMPTS_PER_IP) {
    return NextResponse.json(
      { error: "Demasiados avisos desde esta conexión. Intenta de nuevo en un rato." },
      { status: 429 }
    );
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { email } = parsed.data;
  const query = normalizeAlertQuery(parsed.data.query);
  if (query.length < 2) {
    return NextResponse.json({ error: "Escribe qué figura o personaje buscas" }, { status: 400 });
  }

  const user = await getCurrentUser();
  const trustedEmail = !!user && user.emailVerified && user.email.toLowerCase() === email;
  const now = new Date();
  const genericResponse = () => NextResponse.json({ query, confirmed: trustedEmail });

  await prisma.stockAlert.deleteMany({
    where: { email, confirmedAt: null, createdAt: { lt: hoursAgo(UNCONFIRMED_TTL_HOURS) } },
  });

  const existing = await prisma.stockAlert.findUnique({
    where: { email_query: { email, query } },
  });

  if (existing) {
    if (existing.confirmedAt || trustedEmail) {
      // Volver a pedirlo renueva los 6 meses.
      await prisma.stockAlert.update({
        where: { id: existing.id },
        data: { createdAt: now, confirmedAt: existing.confirmedAt ?? now },
      });
    } else if (!existing.confirmSentAt || existing.confirmSentAt < hoursAgo(CONFIRM_RESEND_HOURS)) {
      await prisma.stockAlert.update({ where: { id: existing.id }, data: { confirmSentAt: now } });
      await sendAlertConfirmEmail(email, query, existing.token);
    }
    return genericResponse();
  }

  const [confirmedCount, unconfirmedCount] = await Promise.all([
    prisma.stockAlert.count({ where: { email, confirmedAt: { not: null } } }),
    prisma.stockAlert.count({ where: { email, confirmedAt: null } }),
  ]);
  if (trustedEmail && confirmedCount >= MAX_ALERTS_PER_EMAIL) {
    return NextResponse.json(
      { error: "Ya tienes muchos avisos. Da de baja alguno desde los correos que te llegaron." },
      { status: 400 }
    );
  }
  // Sin sesión no se revela nada: la respuesta es la misma que si se hubiera creado.
  if (
    !trustedEmail &&
    (unconfirmedCount >= MAX_UNCONFIRMED_PER_EMAIL || confirmedCount >= MAX_ALERTS_PER_EMAIL)
  ) {
    return genericResponse();
  }

  const token = randomBytes(24).toString("hex");
  try {
    await prisma.stockAlert.create({
      data: {
        email,
        query,
        token,
        confirmedAt: trustedEmail ? now : null,
        confirmSentAt: trustedEmail ? null : now,
      },
    });
  } catch {
    // Dos envíos iguales al mismo tiempo: el otro ya lo creó.
    return genericResponse();
  }
  if (!trustedEmail) {
    await sendAlertConfirmEmail(email, query, token);
  }

  return NextResponse.json({ query, confirmed: trustedEmail }, { status: 201 });
}
