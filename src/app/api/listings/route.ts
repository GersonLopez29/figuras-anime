import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { saveUploadedImage } from "@/lib/uploads";
import { getCategoryNames, isValidCategory } from "@/lib/categories";
import { isValidCondition } from "@/lib/condition";
import { deliveryFieldsSchema, readDeliveryFields } from "@/lib/delivery";
import { preorderFieldsSchema, readPreorderFields } from "@/lib/preorder";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get("categoria");
  const q = searchParams.get("q")?.trim();
  const categoryNames = category ? await getCategoryNames() : [];

  const listings = await prisma.listing.findMany({
    where: {
      ...(category && categoryNames.includes(category) ? { category } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      images: true,
      user: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(listings);
}

const createListingSchema = z.object({
  title: z.string().trim().min(3, "El título debe tener al menos 3 caracteres"),
  description: z.string().trim().min(10, "Describe un poco más la figura"),
  price: z.coerce.number().positive("El precio debe ser mayor a 0"),
  category: z.string().trim().min(1, "Selecciona una categoría"),
  condition: z.string().trim().min(1, "Indica el estado de la figura"),
}).merge(deliveryFieldsSchema);

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  }
  if (!user.emailVerified) {
    return NextResponse.json(
      { error: "Verifica tu correo antes de publicar una figura" },
      { status: 403 }
    );
  }

  const formData = await request.formData();

  const parsed = createListingSchema.safeParse({
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
  if (!(await isValidCategory(parsed.data.category))) {
    return NextResponse.json({ error: "Selecciona una categoría válida" }, { status: 400 });
  }

  const files = formData
    .getAll("images")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (files.length === 0) {
    return NextResponse.json(
      { error: "Sube al menos una imagen de la figura" },
      { status: 400 }
    );
  }
  if (files.length > 6) {
    return NextResponse.json(
      { error: "Puedes subir hasta 6 imágenes por figura" },
      { status: 400 }
    );
  }

  let imageUrls: string[];
  try {
    imageUrls = await Promise.all(files.map(saveUploadedImage));
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudieron subir las imágenes";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const listing = await prisma.listing.create({
    data: {
      ...parsed.data,
      ...preorder.data,
      userId: user.id,
      images: { create: imageUrls.map((url) => ({ url })) },
    },
    include: { images: true },
  });

  return NextResponse.json(listing, { status: 201 });
}
