import Link from "next/link";
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
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-3xl flex-col px-4 py-6">
      <Link href="/mensajes" className="text-sm text-zinc-500 hover:text-zinc-800">
        &larr; Mensajes
      </Link>

      <Link
        href={`/figura/${conversation.listing.id}`}
        className="mt-3 flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3 hover:border-orange-300"
      >
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-zinc-100">
          {conversation.listing.images[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={conversation.listing.images[0].url}
              alt=""
              className="h-full w-full object-cover"
            />
          )}
        </div>
        <div className="min-w-0">
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
