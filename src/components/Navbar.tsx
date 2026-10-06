import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/session";
import LogoutButton from "@/components/LogoutButton";
import MobileMenu from "@/components/MobileMenu";
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
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white">
      <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5">
        <Link href="/" className="flex items-center gap-2 text-2xl font-extrabold sm:text-3xl">
          <span aria-hidden="true" className="logo-pop inline-block text-3xl sm:text-4xl">
            🎌
          </span>
          <span className="logo-shine">FigurasAnime</span>
        </Link>

        <nav className="hidden items-center gap-5 md:flex">
          <Badge
            render={<Link href="/comunidad" />}
            className="h-auto gap-1 bg-gradient-to-r from-fuchsia-500 to-orange-500 px-3.5 py-1.5 text-sm font-bold text-white shadow-sm transition hover:shadow-md hover:brightness-105"
          >
            <span aria-hidden="true">✨</span>
            Comunidad
          </Badge>
          {user ? (
            <>
              <Link
                href="/mis-figuras"
                className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
              >
                Mis figuras
              </Link>
              <Link
                href="/favoritos"
                className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
              >
                Favoritos
              </Link>
              <MessagesNavLink
                initialCount={unreadCount}
                className="flex items-center text-sm font-medium text-zinc-600 hover:text-zinc-900"
              />
              {admin && (
                <Link
                  href="/admin"
                  className="text-sm font-medium text-red-600 hover:text-red-800"
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
                className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
              >
                Iniciar sesión
              </Link>
              <Button render={<Link href="/registro" />} nativeButton={false} className="rounded-full">
                Vende tus figuras
              </Button>
            </>
          )}
        </nav>

        <MobileMenu
          isLoggedIn={!!user}
          userName={user?.name}
          isAdmin={admin}
          unreadCount={unreadCount}
        />
      </div>
    </header>
  );
}
