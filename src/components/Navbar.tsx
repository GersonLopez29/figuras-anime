import Link from "next/link";
import { getCurrentUser, isAdmin } from "@/lib/session";
import LogoutButton from "@/components/LogoutButton";

export default async function Navbar() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5">
        <Link href="/" className="flex items-center gap-1.5 text-lg font-extrabold text-zinc-900">
          <span aria-hidden="true">🎌</span>
          Figuras<span className="text-orange-600">Anime</span>
        </Link>

        <nav className="flex items-center gap-4 sm:gap-5">
          <Link
            href="/comunidad"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
          >
            Comunidad
          </Link>
          {user ? (
            <>
              <Link
                href="/mis-figuras"
                className="hidden text-sm font-medium text-zinc-600 hover:text-zinc-900 sm:inline"
              >
                Mis figuras
              </Link>
              {isAdmin(user) && (
                <Link
                  href="/admin"
                  className="hidden text-sm font-medium text-red-600 hover:text-red-800 sm:inline"
                >
                  Panel admin
                </Link>
              )}
              <span className="hidden text-sm text-zinc-400 md:inline">
                Hola, {user.name}
              </span>
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
      </div>
    </header>
  );
}
