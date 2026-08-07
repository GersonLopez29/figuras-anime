import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { formatPrice } from "@/lib/format";
import ConversationThread from "@/components/ConversationThread";

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
      <Link href="/mensajes" className="text-sm text-zinc-500 hover:text-zinc-800">
        &larr; Mensajes
      </Link>

      <Link
        href={`/figura/${conversation.listing.id}`}
        className="mt-3 flex items-center gap-3 rounded-2xl border border-zinc-100 bg-white p-3 shadow-sm transition hover:border-orange-300"
      >
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
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
          <p className="truncate text-sm font-semibold text-zinc-900">
            {conversation.listing.title}
          </p>
          <p className="text-xs text-zinc-500">
            {formatPrice(conversation.listing.price)}
            {conversation.listing.sold ? " · Vendido" : ""} · Chat con {otherUser.name}
          </p>
        </div>
      </Link>

      <ConversationThread
        conversationId={conversation.id}
        currentUserId={user.id}
        initialMessages={conversation.messages}
      />
    </div>
  );
}
