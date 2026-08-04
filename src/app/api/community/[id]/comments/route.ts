import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

const commentSchema = z.object({
  text: z.string().trim().min(1, "Escribe un comentario").max(1000),
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

  const body = await request.json();
  const parsed = commentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const comment = await prisma.postComment.create({
    data: { text: parsed.data.text, authorId: user.id, postId: id },
    include: { author: { select: { name: true } } },
  });

  return NextResponse.json(comment, { status: 201 });
}
