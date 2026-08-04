import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/session";
import { saveUploadedImage, deleteUploadedImage } from "@/lib/uploads";
import { CATEGORIES } from "@/lib/categories";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      images: true,
      user: { select: { name: true, whatsapp: true } },
    },
  });

  if (!listing) {
    return NextResponse.json({ error: "Publicación no encontrada" }, { status: 404 });
  }

  return NextResponse.json(listing);
}

const updateListingSchema = z.object({
  title: z.string().trim().min(3, "El título debe tener al menos 3 caracteres"),
  description: z.string().trim().min(10, "Describe un poco más la figura"),
  price: z.coerce.number().positive("El precio debe ser mayor a 0"),
  category: z.enum(CATEGORIES, { message: "Selecciona una categoría válida" }),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  }

  const existing = await prisma.listing.findUnique({
    where: { id },
    include: { images: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Publicación no encontrada" }, { status: 404 });
  }
  if (existing.userId !== user.id) {
    return NextResponse.json({ error: "No puedes editar esta publicación" }, { status: 403 });
  }

  const formData = await request.formData();

  const parsed = updateListingSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    price: formData.get("price"),
    category: formData.get("category"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const removeImageIds = formData.getAll("removeImageIds").map(String);
  const newFiles = formData
    .getAll("images")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  const remainingCount = existing.images.length - removeImageIds.length + newFiles.length;
  if (remainingCount < 1) {
    return NextResponse.json(
      { error: "La publicación debe tener al menos una imagen" },
      { status: 400 }
    );
  }
  if (remainingCount > 6) {
    return NextResponse.json(
      { error: "Puedes tener hasta 6 imágenes por figura" },
      { status: 400 }
    );
  }

  let newImageUrls: string[] = [];
  try {
    newImageUrls = await Promise.all(newFiles.map(saveUploadedImage));
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudieron subir las imágenes";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const imagesToDelete = existing.images.filter((img) => removeImageIds.includes(img.id));

  await prisma.$transaction([
    prisma.listing.update({
      where: { id },
      data: {
        ...parsed.data,
        images: {
          deleteMany: { id: { in: removeImageIds } },
          create: newImageUrls.map((url) => ({ url })),
        },
      },
    }),
  ]);

  await Promise.all(imagesToDelete.map((img) => deleteUploadedImage(img.url)));

  const updated = await prisma.listing.findUnique({
    where: { id },
    include: { images: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  }

  const existing = await prisma.listing.findUnique({
    where: { id },
    include: { images: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Publicación no encontrada" }, { status: 404 });
  }
  if (existing.userId !== user.id && !isAdmin(user)) {
    return NextResponse.json({ error: "No puedes eliminar esta publicación" }, { status: 403 });
  }

  await prisma.listing.delete({ where: { id } });
  await Promise.all(existing.images.map((img) => deleteUploadedImage(img.url)));

  return NextResponse.json({ ok: true });
}
