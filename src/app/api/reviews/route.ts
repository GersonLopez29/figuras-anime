import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { sendNewReviewEmail } from "@/lib/email";

const createReviewSchema = z.object({
  sellerId: z.string().min(1),
  rating: z.coerce.number().int().min(1, "La calificación debe ser de 1 a 5").max(5, "La calificación debe ser de 1 a 5"),
  comment: z.string().trim().min(5, "Escribe un comentario un poco más largo").max(1000),
});

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { sellerId, rating, comment } = parsed.data;

  if (sellerId === user.id) {
    return NextResponse.json(
      { error: "No puedes dejarte una reseña a ti mismo" },
      { status: 400 }
    );
  }

  const seller = await prisma.user.findUnique({ where: { id: sellerId } });
  if (!seller) {
    return NextResponse.json({ error: "Vendedor no encontrado" }, { status: 404 });
  }

  const review = await prisma.review.create({
    data: { sellerId, authorId: user.id, rating, comment },
    include: { author: { select: { name: true } } },
  });

  await sendNewReviewEmail(seller.email, seller.name, user.name, rating, comment, seller.id);

  return NextResponse.json(review, { status: 201 });
}
