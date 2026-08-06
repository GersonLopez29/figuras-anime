import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { sendVerificationEmail } from "@/lib/email";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  }
  if (user.emailVerified) {
    return NextResponse.json({ error: "Tu correo ya está verificado" }, { status: 400 });
  }

  const verificationToken = randomBytes(32).toString("hex");
  const verificationTokenExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

  await prisma.user.update({
    where: { id: user.id },
    data: { verificationToken, verificationTokenExpiresAt },
  });

  await sendVerificationEmail(user.email, user.name, verificationToken);

  return NextResponse.json({ ok: true });
}
