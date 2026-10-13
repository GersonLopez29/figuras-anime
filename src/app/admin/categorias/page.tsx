import { prisma } from "@/lib/db";
import CategoryRequestActions from "@/components/admin/CategoryRequestActions";
import CategoryManager from "@/components/admin/CategoryManager";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tags } from "lucide-react";
import { AdminEmpty, AdminPageHeader, AdminSectionTitle } from "@/components/admin/AdminUi";

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
      <AdminPageHeader
        icon={Tags}
        title="Categorías"
        description="Las categorías que pueden elegir los vendedores, y las que piden agregar."
      />
      <div>
        <AdminSectionTitle>
          Solicitudes de categoría
          {pending.length > 0 && (
            <Badge className="bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/40">
              {pending.length} pendiente{pending.length === 1 ? "" : "s"}
            </Badge>
          )}
        </AdminSectionTitle>

        {pending.length === 0 ? (
          <AdminEmpty>No hay solicitudes pendientes.</AdminEmpty>
        ) : (
          <Card className="gap-0 divide-y divide-border py-0 shadow-sm">
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
          <AdminSectionTitle>Resueltas recientemente</AdminSectionTitle>
          <Card className="gap-0 divide-y divide-border py-0 shadow-sm">
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
        <AdminSectionTitle description="Crea, renombra o elimina las categorías disponibles para todos los vendedores.">
          Categorías actuales ({categories.length})
        </AdminSectionTitle>
        <div>
          <CategoryManager categories={categoryRows} />
        </div>
      </div>
    </div>
  );
}
