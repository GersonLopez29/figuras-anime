import Link from "next/link";
import { getCurrentUser, isAdmin } from "@/lib/session";
import LogoutButton from "@/components/LogoutButton";
import MobileMenu from "@/components/MobileMenu";

export default async function Navbar() {
  const user = await getCurrentUser();
  const admin = isAdmin(user);

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5">
        <Link href="/" className="flex items-center gap-2 text-2xl font-extrabold sm:text-3xl">
          <span aria-hidden="true" className="logo-pop inline-block text-3xl sm:text-4xl">
            🎌
          </span>
          <span className="logo-shine">FigurasAnime</span>
        </Link>

        <nav className="hidden items-center gap-5 md:flex">
          <Link
            href="/comunidad"
            className="flex items-center gap-1 rounded-full bg-gradient-to-r from-fuchsia-500 to-orange-500 px-3.5 py-1.5 text-sm font-bold text-white shadow-sm transition hover:shadow-md hover:brightness-105"
          >
            <span aria-hidden="true">✨</span>
            Comunidad
          </Link>
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
              {admin && (
                <Link
                  href="/admin"
                  className="text-sm font-medium text-red-600 hover:text-red-800"
                >
                  Panel admin
                </Link>
              )}
              <span className="text-sm text-zinc-400">Hola, {user.name}</span>
              <LogoutButton />
              <Link
                href="/publicar"
                className="rounded-full bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-700"
              >
                Publicar figura
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/registro"
                className="rounded-full bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-700"
              >
                Registrarme
              </Link>
            </>
          )}
        </nav>

        <MobileMenu isLoggedIn={!!user} userName={user?.name} isAdmin={admin} />
      </div>
    </header>
  );
}
