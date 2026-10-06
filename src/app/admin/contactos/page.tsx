import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";

export default async function AdminContactosPage() {
  const clicks = await prisma.whatsAppClick.findMany({
    include: {
      user: { select: { name: true, email: true } },
      listing: { select: { id: true, title: true, user: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground">
        Contactos por WhatsApp ({clicks.length})
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Cada vez que alguien toca &quot;Contactar por WhatsApp&quot; en una figura aparece aquí,
        tenga cuenta o no. Se muestran los últimos 200.
      </p>

      {clicks.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Todavía no hay contactos registrados.</p>
      ) : (
        <Card className="mt-4 gap-0 divide-y divide-border py-0 shadow-sm">
          {clicks.map((click) => (
            <div key={click.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
              <div className="min-w-0">
                <p className="text-sm text-foreground">
                  {click.user ? (
                    <>
                      <span className="font-medium">{click.user.name}</span>{" "}
                      <span className="text-muted-foreground">({click.user.email})</span>
                    </>
                  ) : (
                    <span className="font-medium text-muted-foreground">Visitante sin cuenta</span>
                  )}{" "}
                  contactó por{" "}
                  <Link
                    href={`/figura/${click.listing.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {click.listing.title}
                  </Link>
                  <span className="text-muted-foreground"> de {click.listing.user.name}</span>
                </p>
              </div>
              <p className="shrink-0 text-xs text-muted-foreground">
                {click.createdAt.toLocaleString("es-PE", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
