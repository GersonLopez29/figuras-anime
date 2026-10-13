import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  CircleCheck,
  Clapperboard,
  ExternalLink,
  Flag,
  Handshake,
  PlusCircle,
  Share2,
  Star,
  Tags,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { getAdminPendingCounts } from "@/lib/adminPending";
import { formatPrice } from "@/lib/format";
import { listingPath } from "@/lib/slug";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminPageHeader } from "@/components/admin/AdminUi";

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function timeAgo(date: Date, now: Date) {
  const min = Math.round((now.getTime() - date.getTime()) / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? "ayer" : `hace ${d} días`;
}

export default async function AdminInicioPage() {
  const now = new Date();
  const today = startOfUtcDay(now);
  const weekAgo = new Date(now.getTime() - 7 * DAY_MS);
  const monthAgo = new Date(now.getTime() - 30 * DAY_MS);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    user,
    pending,
    visitsToday,
    visitsWeek,
    contactsWeek,
    offersWeek,
    available,
    soldMonth,
    newUsersWeek,
    featuredIncome,
    recentContacts,
    recentListings,
    recentUsers,
  ] = await Promise.all([
    getCurrentUser(),
    getAdminPendingCounts(),
    prisma.visitStat.aggregate({ where: { date: today }, _sum: { count: true } }),
    prisma.visitStat.aggregate({
      where: { date: { gte: new Date(today.getTime() - 6 * DAY_MS) } },
      _sum: { count: true },
    }),
    prisma.whatsAppClick.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.whatsAppClick.count({ where: { createdAt: { gte: weekAgo }, offerAmount: { not: null } } }),
    prisma.listing.count({ where: { sold: false } }),
    prisma.listing.count({ where: { sold: true, soldAt: { gte: monthAgo } } }),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.featureRequest.aggregate({
      where: { status: "approved", resolvedAt: { gte: monthStart } },
      _sum: { amount: true },
    }),
    prisma.whatsAppClick.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        createdAt: true,
        offerAmount: true,
        user: { select: { name: true } },
        listing: { select: { id: true, slug: true, title: true } },
      },
    }),
    prisma.listing.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        slug: true,
        title: true,
        price: true,
        sold: true,
        createdAt: true,
        images: { select: { url: true }, take: 1 },
        user: { select: { name: true } },
      },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, name: true, email: true, createdAt: true, emailVerified: true },
    }),
  ]);

  const todo = [
    {
      href: "/admin/destacados",
      count: pending.featureRequests,
      icon: Star,
      title: "Destacados por aprobar",
      hint: "Confirma el pago en tu Yape o Plin",
    },
    {
      href: "/admin/consignaciones",
      count: pending.consignments,
      icon: Handshake,
      title: "Te la vendemos: nuevas",
      hint: "Escríbele al coleccionista",
    },
    {
      href: "/admin/categorias",
      count: pending.categoryRequests,
      icon: Tags,
      title: "Categorías solicitadas",
      hint: "Agrégala o recházala",
    },
    {
      href: "/admin/comunidad?filtro=reportadas",
      count: pending.reportedPosts,
      icon: Flag,
      title: "Publicaciones reportadas",
      hint: "Revisa y elimina o quita el reporte",
    },
  ];
  const openTodo = todo.filter((t) => t.count > 0);

  const stats = [
    { label: "Visitas hoy", value: (visitsToday._sum.count ?? 0).toLocaleString("es-PE"), href: "/admin/estadisticas" },
    { label: "Visitas 7 días", value: (visitsWeek._sum.count ?? 0).toLocaleString("es-PE"), href: "/admin/estadisticas" },
    {
      label: "Contactos 7 días",
      value: contactsWeek.toLocaleString("es-PE"),
      note: offersWeek > 0 ? `${offersWeek} con oferta` : undefined,
      href: "/admin/contactos",
    },
    { label: "Figuras disponibles", value: available.toLocaleString("es-PE"), href: "/admin/publicaciones?estado=disponibles" },
    { label: "Vendidas en 30 días", value: soldMonth.toLocaleString("es-PE"), href: "/admin/publicaciones?estado=vendidas" },
    { label: "Usuarios nuevos 7 días", value: newUsersWeek.toLocaleString("es-PE"), href: "/admin/usuarios" },
    {
      label: "Destacados cobrados (mes)",
      value: formatPrice(featuredIncome._sum.amount ?? 0),
      href: "/admin/destacados",
    },
  ];

  const shortcuts = [
    { href: "/admin/videos", icon: Clapperboard, label: "Hacer video TikTok" },
    { href: "/admin/redes", icon: Share2, label: "Imágenes para redes" },
    { href: "/publicar", icon: PlusCircle, label: "Publicar figura" },
    { href: "/", icon: ExternalLink, label: "Ver la página" },
  ];

  const dateLabel = now.toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Lima",
  });

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title={`Hola, ${user?.name.split(" ")[0] ?? "admin"}`}
        description={<span className="first-letter:uppercase">{dateLabel}</span>}
      />

      {/* Por atender */}
      <section aria-labelledby="todo-title">
        <h2 id="todo-title" className="mb-3 text-lg font-semibold text-foreground">
          Por atender
        </h2>
        {openTodo.length === 0 ? (
          <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-4 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/40 dark:text-green-200">
            <CircleCheck className="size-5 shrink-0" aria-hidden="true" />
            Todo al día: no hay pagos, solicitudes ni reportes esperando.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {openTodo.map((t) => {
              const Icon = t.icon;
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className="group flex items-center gap-4 rounded-xl border border-orange-200 bg-orange-50 p-4 transition hover:border-orange-300 hover:bg-orange-100 dark:border-orange-900 dark:bg-orange-950/30 dark:hover:bg-orange-950/50"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-foreground">
                      {t.count} · {t.title}
                    </span>
                    <span className="block text-sm text-muted-foreground">{t.hint}</span>
                  </span>
                  <ArrowRight
                    className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Números clave */}
      <section aria-labelledby="stats-title">
        <h2 id="stats-title" className="mb-3 text-lg font-semibold text-foreground">
          Cómo va la página
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {stats.map((s) => (
            <Link
              key={s.label}
              href={s.href}
              className="rounded-xl border border-border bg-card p-4 shadow-xs transition hover:border-primary/40 hover:bg-primary/5"
            >
              <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{s.value}</p>
              {s.note && <p className="text-xs text-green-700 dark:text-green-300">{s.note}</p>}
            </Link>
          ))}
        </div>
      </section>

      {/* Atajos */}
      <section aria-labelledby="shortcuts-title">
        <h2 id="shortcuts-title" className="mb-3 text-lg font-semibold text-foreground">
          Atajos
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {shortcuts.map((s) => {
            const Icon = s.icon;
            return (
              <Link
                key={s.href}
                href={s.href}
                className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card px-3 py-4 text-center text-sm font-medium text-foreground shadow-xs transition hover:border-primary/40 hover:bg-primary/5"
              >
                <Icon className="size-5 text-primary" aria-hidden="true" />
                {s.label}
              </Link>
            );
          })}
        </div>
      </section>

      {/* Actividad reciente */}
      <section aria-labelledby="recent-title">
        <h2 id="recent-title" className="mb-3 text-lg font-semibold text-foreground">
          Actividad reciente
        </h2>
        <div className="grid gap-4 xl:grid-cols-3">
          <Card className="gap-0 py-0">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold text-foreground">Últimos contactos</h3>
              <Link href="/admin/contactos" className="text-xs font-medium text-primary hover:underline">
                Ver todos
              </Link>
            </div>
            {recentContacts.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground">Todavía no hay contactos.</p>
            ) : (
              <ul className="divide-y divide-border">
                {recentContacts.map((c) => (
                  <li key={c.id} className="px-4 py-2.5 text-sm">
                    <Link href={listingPath(c.listing)} className="line-clamp-1 font-medium text-foreground hover:underline">
                      {c.listing.title}
                    </Link>
                    <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                      <span>
                        {c.user?.name ?? "Visitante"} · {timeAgo(c.createdAt, now)}
                      </span>
                      {c.offerAmount !== null && (
                        <Badge className="h-auto bg-green-100 px-1.5 py-0 text-[11px] text-green-800 dark:bg-green-900/40 dark:text-green-300">
                          🤝 ofertó {formatPrice(c.offerAmount)}
                        </Badge>
                      )}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="gap-0 py-0">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold text-foreground">Últimas figuras</h3>
              <Link href="/admin/publicaciones" className="text-xs font-medium text-primary hover:underline">
                Ver todas
              </Link>
            </div>
            {recentListings.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground">Todavía no hay figuras.</p>
            ) : (
              <ul className="divide-y divide-border">
                {recentListings.map((l) => (
                  <li key={l.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                    <span className="relative size-9 shrink-0 overflow-hidden rounded-md bg-muted">
                      {l.images[0] && (
                        <Image src={l.images[0].url} alt="" fill sizes="36px" className="object-cover" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <Link href={listingPath(l)} className="line-clamp-1 font-medium text-foreground hover:underline">
                        {l.title}
                      </Link>
                      <span className="block text-xs text-muted-foreground">
                        {formatPrice(l.price)} · {l.user.name} · {timeAgo(l.createdAt, now)}
                        {l.sold && " · vendida"}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="gap-0 py-0">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold text-foreground">Nuevos usuarios</h3>
              <Link href="/admin/usuarios" className="text-xs font-medium text-primary hover:underline">
                Ver todos
              </Link>
            </div>
            {recentUsers.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground">Todavía no hay usuarios.</p>
            ) : (
              <ul className="divide-y divide-border">
                {recentUsers.map((u) => (
                  <li key={u.id} className="px-4 py-2.5 text-sm">
                    <p className="line-clamp-1 font-medium text-foreground">{u.name}</p>
                    <p className="line-clamp-1 text-xs text-muted-foreground">
                      {u.email} · {timeAgo(u.createdAt, now)}
                      {!u.emailVerified && " · sin verificar"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </section>
    </div>
  );
}
