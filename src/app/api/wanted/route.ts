import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { isValidCategory } from "@/lib/categories";
import { WANTED_MAX_OPEN_PER_USER, wantedActiveSince } from "@/lib/wanted";

const schema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Escribe qué figura buscas")
    .max(80, "El título es muy largo (máximo 80 caracteres)"),
  details: z.string().trim().max(500, "Los detalles son muy largos (máximo 500 caracteres)").default(""),
  maxPrice: z
    .union([z.literal(""), z.null(), z.coerce.number().positive("El presupuesto debe ser mayor a 0").max(100000)])
    .transform((v) => (v === "" || v === null ? null : v))
    .default(null),
  category: z
    .union([z.literal(""), z.null(), z.string().trim()])
    .transform((v) => (v ? v : null))
    .default(null),
});

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Inicia sesión para publicar lo que buscas" }, { status: 401 });
  }
  if (!user.emailVerified) {
    return NextResponse.json({ error: "Verifica tu correo antes de publicar" }, { status: 403 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  if (parsed.data.category && !(await isValidCategory(parsed.data.category))) {
    return NextResponse.json({ error: "Selecciona una categoría válida" }, { status: 400 });
  }

  const openCount = await prisma.wantedPost.count({
    where: { userId: user.id, status: "open", createdAt: { gte: wantedActiveSince() } },
  });
  if (openCount >= WANTED_MAX_OPEN_PER_USER) {
    return NextResponse.json(
      {
        error: `Puedes tener hasta ${WANTED_MAX_OPEN_PER_USER} pedidos abiertos. Marca alguno como conseguido o bórralo.`,
      },
      { status: 400 }
    );
  }

  const post = await prisma.wantedPost.create({
    data: { ...parsed.data, userId: user.id },
    select: { id: true },
  });
  return NextResponse.json(post, { status: 201 });
}
