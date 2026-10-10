import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/session";
import LogoutButton from "@/components/LogoutButton";
import MobileMenu from "@/components/MobileMenu";
import ThemeToggle from "@/components/ThemeToggle";
import MessagesNavLink from "@/components/MessagesNavLink";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function Navbar() {
  const user = await getCurrentUser();
  const admin = isAdmin(user);
  const unreadCount = user
    ? await prisma.message.count({
        where: {
          readAt: null,
          senderId: { not: user.id },
          conversation: { OR: [{ buyerId: user.id }, { sellerId: user.id }] },
        },
      })
    : 0;

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card">
      <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5">
        <Link href="/" className="flex items-center gap-2 text-2xl font-extrabold sm:text-3xl">
          <span aria-hidden="true" className="logo-pop inline-block text-3xl sm:text-4xl">
            🎌
          </span>
          <span className="logo-shine">FigurasAnime</span>
        </Link>

        {/* Buscador siempre a mano en pantallas grandes (en las chicas está
            arriba del catálogo). */}
        <form action="/" method="get" role="search" className="hidden max-w-sm flex-1 xl:flex">
          <label htmlFor="nav-search" className="sr-only">
            Buscar figuras
          </label>
          <div className="relative w-full">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground/70">
              🔍
            </span>
            <input
              id="nav-search"
              type="search"
              name="q"
              placeholder="Buscar figuras (ej: Goku, Naruto...)"
              className="w-full rounded-full border border-input bg-muted/40 py-2 pl-10 pr-4 text-sm transition focus:border-orange-500 focus:bg-card focus:outline-none"
            />
          </div>
        </form>

        <nav className="hidden items-center gap-5 md:flex">
          <Badge
            render={<Link href="/comunidad" />}
            className="h-auto gap-1 bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 ring-1 ring-orange-200 dark:ring-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/40 px-3.5 py-1.5 text-sm font-semibold transition"
          >
            <span aria-hidden="true">✨</span>
            Comunidad
          </Badge>
          <Link href="/se-busca" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Se busca
          </Link>
          {user ? (
            <>
              <Link
                href="/mis-figuras"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Mis figuras
              </Link>
              <Link
                href="/favoritos"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Favoritos
              </Link>
              <MessagesNavLink
                initialCount={unreadCount}
                className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
              />
              {admin && (
                <Link
                  href="/admin"
                  className="text-sm font-medium text-red-600 hover:text-red-800 dark:hover:text-red-300"
                >
                  Panel admin
                </Link>
              )}
              <span className="text-sm text-muted-foreground">Hola, {user.name}</span>
              <LogoutButton />
              <Button render={<Link href="/publicar" />} nativeButton={false} className="rounded-full">
                Publicar figura
              </Button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Iniciar sesión
              </Link>
              <Button render={<Link href="/registro" />} nativeButton={false} className="rounded-full">
                Vende tus figuras
              </Button>
            </>
          )}
          <ThemeToggle />
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <MobileMenu
            isLoggedIn={!!user}
            userName={user?.name}
            isAdmin={admin}
            unreadCount={unreadCount}
          />
        </div>
      </div>
    </header>
  );
}
