import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

const categoryRequestSchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres").max(40),
  message: z.string().trim().min(5, "Cuéntale al administrador por qué falta esta categoría").max(300),
});

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = categoryRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const existingCategory = await prisma.category.findFirst({
    where: { name: { equals: parsed.data.name, mode: "insensitive" } },
  });
  if (existingCategory) {
    return NextResponse.json(
      { error: "Esa categoría ya existe, selecciónala en el formulario" },
      { status: 400 }
    );
  }

  const created = await prisma.categoryRequest.create({
    data: {
      name: parsed.data.name,
      message: parsed.data.message,
      requesterId: user.id,
    },
  });

  return NextResponse.json(created, { status: 201 });
}
