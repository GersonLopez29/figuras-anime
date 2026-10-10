import { prisma } from "@/lib/db";
import CategoryRequestActions from "@/components/admin/CategoryRequestActions";
import CategoryManager from "@/components/admin/CategoryManager";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AdminCategoriasPage() {
  const [pending, resolved, categories, listingCounts] = await Promise.all([
    prisma.categoryRequest.findMany({
      where: { status: "pending" },
      include: { requester: { select: { name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.categoryRequest.findMany({
      where: { status: { not: "pending" } },
      include: { requester: { select: { name: true, email: true } } },
      orderBy: { resolvedAt: "desc" },
      take: 10,
    }),
    prisma.category.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.listing.groupBy({ by: ["category"], _count: true }),
  ]);

  const listingCountByCategory = new Map(
    listingCounts.map((row) => [row.category, row._count])
  );
  const categoryRows = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    icon: cat.icon,
    listingCount: listingCountByCategory.get(cat.name) ?? 0,
  }));

  return (
    <div className="space-y-10">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          Solicitudes de categoría
          {pending.length > 0 && (
            <Badge className="bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/40">
              {pending.length} pendiente{pending.length === 1 ? "" : "s"}
            </Badge>
          )}
        </h2>

        {pending.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No hay solicitudes pendientes.</p>
        ) : (
          <Card className="mt-4 gap-0 divide-y divide-border py-0 shadow-sm">
            {pending.map((req) => (
              <div key={req.id} className="flex items-start justify-between gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{req.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{req.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Solicitado por {req.requester.name} ({req.requester.email})
                  </p>
                </div>
                <CategoryRequestActions requestId={req.id} />
              </div>
            ))}
          </Card>
        )}
      </div>

      {resolved.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground">Resueltas recientemente</h2>
          <Card className="mt-4 gap-0 divide-y divide-border py-0 shadow-sm">
            {resolved.map((req) => (
              <div key={req.id} className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{req.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Solicitado por {req.requester.name} ({req.requester.email})
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className={req.status === "approved" ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/40" : ""}
                >
                  {req.status === "approved" ? "Agregada" : "Rechazada"}
                </Badge>
              </div>
            ))}
          </Card>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Categorías actuales ({categories.length})
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Crea, renombra o elimina las categorías disponibles para todos los vendedores.
        </p>
        <div className="mt-4">
          <CategoryManager categories={categoryRows} />
        </div>
      </div>
    </div>
  );
}
