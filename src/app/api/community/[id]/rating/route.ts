import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

const ratingSchema = z.object({
  value: z.coerce.number().int().min(1, "La calificación debe ser de 1 a 5").max(5, "La calificación debe ser de 1 a 5"),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  }

  const post = await prisma.collectionPost.findUnique({ where: { id } });
  if (!post) {
    return NextResponse.json({ error: "Publicación no encontrada" }, { status: 404 });
  }
  if (post.authorId === user.id) {
    return NextResponse.json(
      { error: "No puedes calificar tu propia publicación" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const parsed = ratingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const rating = await prisma.postRating.upsert({
    where: { authorId_postId: { authorId: user.id, postId: id } },
    update: { value: parsed.data.value },
    create: { value: parsed.data.value, authorId: user.id, postId: id },
  });

  return NextResponse.json(rating);
}
