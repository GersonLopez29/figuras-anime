import Link from "next/link";
import { prisma } from "@/lib/db";

type VerificarEmailPageProps = {
  searchParams: Promise<{ token?: string }>;
};

type Status = "ok" | "invalid" | "expired" | "missing";

const MESSAGES: Record<Status, { title: string; body: string }> = {
  ok: {
    title: "¡Correo confirmado!",
    body: "Tu cuenta ya está verificada. Gracias por confirmar tu correo.",
  },
  invalid: {
    title: "Enlace inválido",
    body: "Este enlace de verificación no es válido o ya fue usado antes.",
  },
  expired: {
    title: "Enlace vencido",
    body: "Este enlace ya venció. Puedes pedir que te reenviemos uno nuevo desde tu cuenta.",
  },
  missing: {
    title: "Falta el enlace",
    body: "Abre este enlace desde el correo de verificación que te enviamos.",
  },
};

export default async function VerificarEmailPage({ searchParams }: VerificarEmailPageProps) {
  const { token } = await searchParams;
  let status: Status = "missing";

  if (token) {
    const user = await prisma.user.findUnique({ where: { verificationToken: token } });
    if (!user) {
      status = "invalid";
    } else if (user.verificationTokenExpiresAt && user.verificationTokenExpiresAt < new Date()) {
      status = "expired";
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true, verificationToken: null, verificationTokenExpiresAt: null },
      });
      status = "ok";
    }
  }

  const { title, body } = MESSAGES[status];

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <p className="text-4xl">{status === "ok" ? "✅" : "✉️"}</p>
      <h1 className="mt-4 text-2xl font-bold text-zinc-900">{title}</h1>
      <p className="mt-3 text-sm text-zinc-600">{body}</p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-full bg-orange-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
      >
        Ir al inicio
      </Link>
    </div>
  );
}
