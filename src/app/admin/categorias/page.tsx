import { prisma } from "@/lib/db";
import CategoryRequestActions from "@/components/admin/CategoryRequestActions";

export default async function AdminCategoriasPage() {
  const [pending, resolved, categories] = await Promise.all([
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
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">
          Solicitudes de categoría
          {pending.length > 0 && (
            <span className="ml-2 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-700">
              {pending.length} pendiente{pending.length === 1 ? "" : "s"}
            </span>
          )}
        </h2>

        {pending.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">No hay solicitudes pendientes.</p>
        ) : (
          <div className="mt-4 divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
            {pending.map((req) => (
              <div key={req.id} className="flex items-start justify-between gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-900">{req.name}</p>
                  <p className="mt-1 text-sm text-zinc-600">{req.message}</p>
                  <p className="mt-1 text-xs text-zinc-400">
                    Solicitado por {req.requester.name} ({req.requester.email})
                  </p>
                </div>
                <CategoryRequestActions requestId={req.id} />
              </div>
            ))}
          </div>
        )}
      </div>

      {resolved.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">Resueltas recientemente</h2>
          <div className="mt-4 divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
            {resolved.map((req) => (
              <div key={req.id} className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-900">{req.name}</p>
                  <p className="text-xs text-zinc-400">
                    Solicitado por {req.requester.name} ({req.requester.email})
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    req.status === "approved"
                      ? "bg-green-100 text-green-700"
                      : "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  {req.status === "approved" ? "Agregada" : "Rechazada"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-zinc-900">
          Categorías actuales ({categories.length})
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <span
              key={cat.id}
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700"
            >
              <span aria-hidden="true">{cat.icon}</span>
              {cat.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
