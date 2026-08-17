import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";

const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Correo inválido"),
});

const MAX_ATTEMPTS_PER_IP = 5;
const WINDOW_MINUTES = 60;

function getClientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60_000);

  const recentAttempts = await prisma.passwordResetAttempt.count({
    where: { ip, createdAt: { gte: windowStart } },
  });

  if (recentAttempts >= MAX_ATTEMPTS_PER_IP) {
    return NextResponse.json(
      { error: "Demasiados intentos desde esta conexión. Intenta de nuevo en un rato." },
      { status: 429 }
    );
  }

  await prisma.passwordResetAttempt.create({ data: { ip } });

  const body = await request.json();
  const parsed = forgotPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { email } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  // No revelamos por HTTP si el correo existe o no (evita enumeración de usuarios).
  if (user) {
    const resetToken = randomBytes(32).toString("hex");
    const resetTokenExpiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1h

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiresAt },
    });

    await sendPasswordResetEmail(user.email, user.name, resetToken);
  }

  return NextResponse.json({ ok: true });
}
