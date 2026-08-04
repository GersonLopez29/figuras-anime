import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

const reportSchema = z.object({
  reason: z.string().trim().min(5, "Cuéntanos brevemente por qué la reportas").max(500),
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
      { error: "No puedes reportar tu propia publicación" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const existing = await prisma.postReport.findUnique({
    where: { reporterId_postId: { reporterId: user.id, postId: id } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Ya reportaste esta publicación" },
      { status: 409 }
    );
  }

  await prisma.postReport.create({
    data: { reason: parsed.data.reason, reporterId: user.id, postId: id },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
