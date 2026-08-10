import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/session";
import { sendVerificationEmail, sendAccountExistsEmail } from "@/lib/email";

const registerSchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().trim().toLowerCase().email("Correo inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  whatsapp: z
    .string()
    .trim()
    .min(8, "Ingresa un número de WhatsApp válido con código de país"),
});

const MAX_REGISTER_ATTEMPTS_PER_IP = 5;
const REGISTER_WINDOW_MINUTES = 60;

function getClientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const windowStart = new Date(Date.now() - REGISTER_WINDOW_MINUTES * 60_000);

  const recentAttempts = await prisma.registrationAttempt.count({
    where: { ip, createdAt: { gte: windowStart } },
  });

  if (recentAttempts >= MAX_REGISTER_ATTEMPTS_PER_IP) {
    return NextResponse.json(
      { error: "Demasiados intentos de registro desde esta conexión. Intenta de nuevo en un rato." },
      { status: 429 }
    );
  }

  await prisma.registrationAttempt.create({ data: { ip } });

  const body = await request.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { name, email, password, whatsapp } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // No revelamos por HTTP si el correo ya está registrado (evita enumeración de usuarios).
    // Se le avisa al dueño real de la cuenta por correo en su lugar.
    await sendAccountExistsEmail(existing.email, existing.name);
    return NextResponse.json({ name, email });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const verificationToken = randomBytes(32).toString("hex");
  const verificationTokenExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      whatsapp,
      verificationToken,
      verificationTokenExpiresAt,
    },
  });

  await createSession(user.id);
  await sendVerificationEmail(user.email, user.name, verificationToken);

  return NextResponse.json({ name: user.name, email: user.email });
}
