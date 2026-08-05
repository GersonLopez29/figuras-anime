import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/session";

const createCategorySchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres").max(40),
  icon: z.string().trim().min(1).max(8).optional(),
});

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!isAdmin(user)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const existing = await prisma.category.findFirst({
    where: { name: { equals: parsed.data.name, mode: "insensitive" } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Ya existe una categoría con ese nombre" },
      { status: 400 }
    );
  }

  const created = await prisma.category.create({
    data: {
      name: parsed.data.name,
      ...(parsed.data.icon ? { icon: parsed.data.icon } : {}),
    },
  });

  return NextResponse.json(created, { status: 201 });
}
