import Link from "next/link";
import { Users } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import BlockUserButton from "@/components/admin/BlockUserButton";
import DeleteUserButton from "@/components/admin/DeleteUserButton";
import VerifyEmailButton from "@/components/admin/VerifyEmailButton";
import StoreToggleButton from "@/components/admin/StoreToggleButton";
import { OFFICIAL_STORE_NAME } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AdminEmpty,
  AdminFilterChips,
  AdminPageHeader,
  AdminSearch,
} from "@/components/admin/AdminUi";

const BASE = "/admin/usuarios";
const PAGE_SIZE = 100;

const FILTERS = {
  todos: {},
  bloqueados: { isBlocked: true },
  "sin-verificar": { emailVerified: false },
  tiendas: { isOfficialStore: true },
} satisfies Record<string, Prisma.UserWhereInput>;
type FilterKey = keyof typeof FILTERS;

type Props = { searchParams: Promise<{ q?: string; filtro?: string }> };

export default async function AdminUsuariosPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = (params.q ?? "").trim().slice(0, 100);
  const filtro: FilterKey = params.filtro && params.filtro in FILTERS ? (params.filtro as FilterKey) : "todos";

  const where: Prisma.UserWhereInput = {
    ...FILTERS[filtro],
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { whatsapp: { contains: q.replace(/\D/g, "") || q } },
      ],
    }),
  };

  const [currentUser, users, matching, total, blocked, unverified, stores] = await Promise.all([
    getCurrentUser(),
    prisma.user.findMany({
      where,
      include: { _count: { select: { listings: true, collectionPosts: true } } },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
    }),
    prisma.user.count({ where }),
    prisma.user.count(),
    prisma.user.count({ where: FILTERS.bloqueados }),
    prisma.user.count({ where: FILTERS["sin-verificar"] }),
    prisma.user.count({ where: FILTERS.tiendas }),
  ]);

  const current = { q: q || undefined, filtro: filtro === "todos" ? undefined : filtro };

  return (
    <div>
      <AdminPageHeader
        icon={Users}
        title="Usuarios"
        description={`${total.toLocaleString("es-PE")} cuentas registradas. Toca un nombre para ver su perfil de vendedor.`}
      />

      <div className="mb-4 flex flex-col gap-3">
        <AdminSearch
          basePath={BASE}
          query={q}
          placeholder="Buscar por nombre, correo o WhatsApp"
          keep={{ filtro: current.filtro }}
        />
        <AdminFilterChips
          basePath={BASE}
          param="filtro"
          active={filtro}
          current={current}
          label="Filtrar usuarios"
          filters={[
            { value: "todos", label: "Todos", count: total },
            { value: "bloqueados", label: "Bloqueados", count: blocked },
            { value: "sin-verificar", label: "Correo sin verificar", count: unverified },
            { value: "tiendas", label: OFFICIAL_STORE_NAME, count: stores },
          ]}
        />
      </div>

      {q && (
        <p className="mb-3 text-sm text-muted-foreground">
          {matching === 0
            ? `Nadie coincide con "${q}".`
            : `${matching} resultado${matching === 1 ? "" : "s"} para "${q}".`}
        </p>
      )}

      {users.length === 0 ? (
        !q && <AdminEmpty>No hay usuarios en este filtro.</AdminEmpty>
      ) : (
        <Card className="gap-0 divide-y divide-border py-0 shadow-sm">
          {users.map((user) => {
            const isMe = user.id === currentUser?.id;
            return (
              <div key={user.id} className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
                <div className="flex min-w-0 flex-1 gap-3">
                  <span
                    aria-hidden="true"
                    className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary"
                  >
                    {user.name.trim().charAt(0).toUpperCase() || "?"}
                  </span>
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Link
                        href={`/vendedor/${user.id}`}
                        className="font-medium text-foreground hover:underline"
                      >
                        {user.name}
                      </Link>
                      {user.role === "admin" && <Badge variant="secondary">admin</Badge>}
                      {user.isOfficialStore && (
                        <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 dark:bg-orange-900/40 dark:text-orange-300 dark:hover:bg-orange-900/40">
                          ✔ {OFFICIAL_STORE_NAME}
                        </Badge>
                      )}
                      {user.isBlocked && (
                        <Badge className="bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/40 dark:text-red-300 dark:hover:bg-red-900/40">
                          Bloqueado
                        </Badge>
                      )}
                      {!user.emailVerified && (
                        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300 dark:hover:bg-amber-900/40">
                          Correo sin verificar
                        </Badge>
                      )}
                    </div>
                    <p className="break-all text-sm text-muted-foreground">
                      {user.email}
                      {user.whatsapp && (
                        <>
                          {" · "}
                          <a
                            href={buildWhatsAppLink(user.whatsapp, `Hola ${user.name}, te escribo de GerStore.`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-green-700 hover:underline dark:text-green-300"
                          >
                            {user.whatsapp}
                          </a>
                        </>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user._count.listings} {user._count.listings === 1 ? "figura" : "figuras"} ·{" "}
                      {user._count.collectionPosts} en comunidad · registrado el{" "}
                      {user.createdAt.toLocaleDateString("es-PE", { timeZone: "America/Lima" })}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pl-13 lg:justify-end lg:pl-0">
                  <StoreToggleButton userId={user.id} isOfficialStore={user.isOfficialStore} />
                  {isMe ? (
                    <span className="text-xs text-muted-foreground">Esta es tu cuenta</span>
                  ) : (
                    <>
                      <VerifyEmailButton userId={user.id} emailVerified={user.emailVerified} />
                      <BlockUserButton userId={user.id} isBlocked={user.isBlocked} />
                      <DeleteUserButton
                        userId={user.id}
                        userName={user.name}
                        listingCount={user._count.listings}
                      />
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </Card>
      )}

      {matching > users.length && (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Se muestran los {users.length} más recientes de {matching}. Usa el buscador para encontrar a
          alguien en particular.
        </p>
      )}
    </div>
  );
}
