import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { formatPrice } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

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
      <h1 className="text-2xl font-bold text-foreground">Mensajes</h1>

      {conversations.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Todavía no tienes conversaciones. Escribe a un vendedor desde la página de una figura.
        </p>
      ) : (
        <Card className="mt-6 gap-0 divide-y divide-border overflow-hidden py-0">
          {conversations.map((c) => {
            const otherUser = c.buyerId === user.id ? c.seller : c.buyer;
            const lastMessage = c.messages[0];
            const unread = c._count.messages > 0;

            return (
              <Link
                key={c.id}
                href={`/mensajes/${c.id}`}
                className={`flex items-center gap-3 px-4 py-3 transition hover:bg-primary/5 ${
                  unread ? "bg-primary/5" : ""
                }`}
              >
                <Avatar className="h-11 w-11 shrink-0 ring-1 ring-orange-100 dark:ring-orange-800">
                  {c.listing.images[0] && <AvatarImage src={c.listing.images[0].url} alt="" />}
                  <AvatarFallback className="bg-gradient-to-br from-orange-100 dark:from-orange-900/40 to-red-50 dark:to-red-950/20 font-bold text-orange-700">
                    {otherUser.name.slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {otherUser.name}
                    </p>
                    {unread && (
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {c.listing.title} · {formatPrice(c.listing.price)}
                  </p>
                  {lastMessage && (
                    <p
                      className={`mt-0.5 truncate text-sm ${
                        unread ? "font-medium text-foreground/90" : "text-muted-foreground"
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
        </Card>
      )}
    </div>
  );
}
