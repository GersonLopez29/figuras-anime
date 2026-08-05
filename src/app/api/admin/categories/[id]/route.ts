import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/session";

const updateCategorySchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres").max(40).optional(),
  icon: z.string().trim().min(1).max(8).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!isAdmin(user)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  if (!parsed.data.name && !parsed.data.icon) {
    return NextResponse.json({ error: "Nada para actualizar" }, { status: 400 });
  }

  const newName = parsed.data.name?.trim();

  if (newName && newName.toLowerCase() !== existing.name.toLowerCase()) {
    const collision = await prisma.category.findFirst({
      where: { id: { not: id }, name: { equals: newName, mode: "insensitive" } },
    });
    if (collision) {
      return NextResponse.json(
        { error: "Ya existe una categoría con ese nombre" },
        { status: 400 }
      );
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    const category = await tx.category.update({
      where: { id },
      data: {
        ...(newName ? { name: newName } : {}),
        ...(parsed.data.icon ? { icon: parsed.data.icon } : {}),
      },
    });
    if (newName && newName !== existing.name) {
      await tx.listing.updateMany({
        where: { category: existing.name },
        data: { category: newName },
      });
    }
    return category;
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!isAdmin(user)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 });
  }

  const totalCategories = await prisma.category.count();
  if (totalCategories <= 1) {
    return NextResponse.json(
      { error: "Debe existir al menos una categoría" },
      { status: 400 }
    );
  }

  const listingsUsingIt = await prisma.listing.count({ where: { category: existing.name } });
  if (listingsUsingIt > 0) {
    return NextResponse.json(
      {
        error: `No puedes eliminarla: ${listingsUsingIt} figura${listingsUsingIt === 1 ? "" : "s"} todavía la usa${listingsUsingIt === 1 ? "" : "n"}. Cámbiales la categoría primero.`,
      },
      { status: 400 }
    );
  }

  await prisma.category.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
