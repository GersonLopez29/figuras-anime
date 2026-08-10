import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { formatPrice } from "@/lib/format";
import ConversationThread from "@/components/ConversationThread";
import { Card } from "@/components/ui/card";

type MensajePageProps = {
  params: Promise<{ id: string }>;
};

export default async function ConversacionPage({ params }: MensajePageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      listing: { select: { id: true, title: true, price: true, sold: true, images: { take: 1 } } },
      buyer: { select: { id: true, name: true } },
      seller: { select: { id: true, name: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { id: true, name: true } } },
      },
    },
  });

  if (!conversation || (conversation.buyerId !== user.id && conversation.sellerId !== user.id)) {
    notFound();
  }

  await prisma.message.updateMany({
    where: { conversationId: id, senderId: { not: user.id }, readAt: null },
    data: { readAt: new Date() },
  });

  const otherUser = conversation.buyerId === user.id ? conversation.seller : conversation.buyer;

  return (
    <div className="mx-auto flex h-[calc(100dvh-4rem)] max-w-3xl flex-col px-4 py-4 sm:py-6">
      <Link href="/mensajes" className="text-sm text-muted-foreground hover:text-foreground">
        &larr; Mensajes
      </Link>

      <Link href={`/figura/${conversation.listing.id}`} className="mt-3 block">
        <Card className="flex-row items-center gap-3 p-3 shadow-sm transition hover:ring-primary/30">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
            {conversation.listing.images[0] && (
              <Image
                src={conversation.listing.images[0].url}
                alt=""
                fill
                sizes="48px"
                className="object-cover"
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {conversation.listing.title}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatPrice(conversation.listing.price)}
              {conversation.listing.sold ? " · Vendido" : ""} · Chat con {otherUser.name}
            </p>
          </div>
        </Card>
      </Link>

      <ConversationThread
        conversationId={conversation.id}
        currentUserId={user.id}
        initialMessages={conversation.messages}
      />
    </div>
  );
}
