import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

const startConversationSchema = z.object({
  listingId: z.string().min(1),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  }

  const conversations = await prisma.conversation.findMany({
    where: { OR: [{ buyerId: user.id }, { sellerId: user.id }] },
    orderBy: { updatedAt: "desc" },
    include: {
      listing: {
        select: { id: true, title: true, sold: true, images: { take: 1, select: { url: true } } },
      },
      buyer: { select: { id: true, name: true } },
      seller: { select: { id: true, name: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { text: true, createdAt: true, senderId: true },
      },
      _count: {
        select: {
          messages: { where: { senderId: { not: user.id }, readAt: null } },
        },
      },
    },
  });

  const result = conversations.map((c) => ({
    id: c.id,
    listing: c.listing,
    otherUser: c.buyerId === user.id ? c.seller : c.buyer,
    lastMessage: c.messages[0] ?? null,
    unreadCount: c._count.messages,
    updatedAt: c.updatedAt,
  }));

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  }
  if (!user.emailVerified) {
    return NextResponse.json(
      { error: "Verifica tu correo antes de contactar a un vendedor" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const parsed = startConversationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const listing = await prisma.listing.findUnique({
    where: { id: parsed.data.listingId },
    select: { id: true, userId: true },
  });
  if (!listing) {
    return NextResponse.json({ error: "Publicación no encontrada" }, { status: 404 });
  }
  if (listing.userId === user.id) {
    return NextResponse.json(
      { error: "No puedes enviarte un mensaje a ti mismo" },
      { status: 400 }
    );
  }

  const conversation = await prisma.conversation.upsert({
    where: {
      listingId_buyerId_sellerId: {
        listingId: listing.id,
        buyerId: user.id,
        sellerId: listing.userId,
      },
    },
    create: { listingId: listing.id, buyerId: user.id, sellerId: listing.userId },
    update: {},
  });

  return NextResponse.json({ id: conversation.id }, { status: 201 });
}
