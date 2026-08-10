import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/session";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Correo inválido"),
  password: z.string().min(1, "Ingresa tu contraseña"),
});

// Hash de relleno (sin contraseña real detrás) usado para que bcrypt.compare
// tome un tiempo similar tanto si el correo existe como si no.
const DUMMY_HASH = "$2b$10$LahX//Z.Q6jW3blJvPPWrO7HeQHt2K7CQiP029FlPFI6/PJ4Uyh5m";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !valid) {
    return NextResponse.json(
      { error: "Correo o contraseña incorrectos" },
      { status: 401 }
    );
  }

  if (user.isBlocked) {
    return NextResponse.json(
      { error: "Esta cuenta fue bloqueada. Contacta al administrador del sitio." },
      { status: 403 }
    );
  }

  await createSession(user.id);

  return NextResponse.json({ id: user.id, name: user.name, email: user.email });
}
