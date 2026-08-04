import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { saveUploadedImage } from "@/lib/uploads";

const createPostSchema = z.object({
  caption: z.string().trim().min(3, "Cuéntanos algo sobre tu colección").max(2000),
});

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  }

  const formData = await request.formData();

  const parsed = createPostSchema.safeParse({
    caption: formData.get("caption"),
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const files = formData
    .getAll("images")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (files.length === 0) {
    return NextResponse.json(
      { error: "Sube al menos una foto de tu colección" },
      { status: 400 }
    );
  }
  if (files.length > 10) {
    return NextResponse.json(
      { error: "Puedes subir hasta 10 fotos por publicación" },
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

  const post = await prisma.collectionPost.create({
    data: {
      caption: parsed.data.caption,
      authorId: user.id,
      images: { create: imageUrls.map((url) => ({ url })) },
    },
    include: { images: true },
  });

  return NextResponse.json(post, { status: 201 });
}
