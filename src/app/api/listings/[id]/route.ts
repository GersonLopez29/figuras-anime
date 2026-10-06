import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/session";
import { saveUploadedImage, deleteUploadedImage } from "@/lib/uploads";
import { isValidCategory } from "@/lib/categories";
import { isValidCondition } from "@/lib/condition";
import { isValidPhotoType } from "@/lib/photoType";
import { deliveryFieldsSchema, readDeliveryFields } from "@/lib/delivery";
import { preorderFieldsSchema, readPreorderFields } from "@/lib/preorder";
import { slugUpdateForTitle } from "@/lib/listingSlug";

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

  // El WhatsApp del vendedor solo va en la respuesta si hay sesión —
  // misma regla que ya aplica la página de la figura para mostrar el botón de contacto.
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    const { whatsapp: _whatsapp, ...userWithoutContact } = listing.user;
    return NextResponse.json({ ...listing, user: userWithoutContact });
  }

  return NextResponse.json(listing);
}

const updateListingSchema = z.object({
  title: z.string().trim().min(3, "El título debe tener al menos 3 caracteres"),
  description: z.string().trim().min(10, "Describe un poco más la figura"),
  price: z.coerce.number().positive("El precio debe ser mayor a 0"),
  category: z.string().trim().min(1, "Selecciona una categoría"),
  condition: z.string().trim().min(1, "Indica el estado de la figura"),
}).merge(deliveryFieldsSchema);

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
    condition: formData.get("condition"),
    ...readDeliveryFields(formData),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }
  const preorder = preorderFieldsSchema.safeParse(readPreorderFields(formData));
  if (!preorder.success) {
    return NextResponse.json({ error: preorder.error.issues[0].message }, { status: 400 });
  }
  if (
    preorder.data.preorderDeposit !== null &&
    preorder.data.preorderDeposit > parsed.data.price
  ) {
    return NextResponse.json(
      { error: "El adelanto no puede ser mayor al precio" },
      { status: 400 }
    );
  }
  if (!isValidCondition(parsed.data.condition)) {
    return NextResponse.json({ error: "Selecciona un estado válido" }, { status: 400 });
  }
  const photoType = formData.get("photoType");
  if (!isValidPhotoType(photoType)) {
    return NextResponse.json(
      { error: "Indica si las fotos son reales o referenciales" },
      { status: 400 }
    );
  }
  if (!(await isValidCategory(parsed.data.category))) {
    return NextResponse.json({ error: "Selecciona una categoría válida" }, { status: 400 });
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

  // Si cambió el título, el enlace cambia y el anterior sigue redirigiendo.
  const slugChange =
    parsed.data.title !== existing.title ? await slugUpdateForTitle(existing, parsed.data.title) : null;

  await prisma.$transaction([
    prisma.listing.update({
      where: { id },
      data: {
        ...parsed.data,
        ...preorder.data,
        photoType,
        ...(slugChange ?? {}),
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
