import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { formatPrice } from "@/lib/format";

export default async function MensajesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const conversations = await prisma.conversation.findMany({
    where: { OR: [{ buyerId: user.id }, { sellerId: user.id }] },
    orderBy: { updatedAt: "desc" },
    include: {
      listing: { select: { id: true, title: true, price: true, images: { take: 1 } } },
      buyer: { select: { id: true, name: true } },
      seller: { select: { id: true, name: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: {
        select: { messages: { where: { senderId: { not: user.id }, readAt: null } } },
      },
    },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold text-zinc-900">Mensajes</h1>

      {conversations.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-500">
          Todavía no tienes conversaciones. Escribe a un vendedor desde la página de una figura.
        </p>
      ) : (
        <div className="mt-6 divide-y divide-zinc-100 overflow-hidden rounded-lg border border-zinc-200 bg-white">
          {conversations.map((c) => {
            const otherUser = c.buyerId === user.id ? c.seller : c.buyer;
            const lastMessage = c.messages[0];
            const unread = c._count.messages > 0;

            return (
              <Link
                key={c.id}
                href={`/mensajes/${c.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50"
              >
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-zinc-100">
                  {c.listing.images[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.listing.images[0].url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-zinc-900">
                      {otherUser.name}
                    </p>
                    {unread && (
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-orange-600" />
                    )}
                  </div>
                  <p className="truncate text-xs text-zinc-500">
                    {c.listing.title} · {formatPrice(c.listing.price)}
                  </p>
                  {lastMessage && (
                    <p
                      className={`mt-0.5 truncate text-sm ${
                        unread ? "font-medium text-zinc-800" : "text-zinc-500"
                      }`}
                    >
                      {lastMessage.senderId === user.id ? "Tú: " : ""}
                      {lastMessage.text}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
