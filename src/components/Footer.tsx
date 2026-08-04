import Link from "next/link";
import { CATEGORIES, CATEGORY_ICONS } from "@/lib/categories";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 rounded-t-3xl border-t border-zinc-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <p className="flex items-center gap-1.5 text-base font-extrabold text-zinc-900">
              <span aria-hidden="true">🎌</span>
              Figuras<span className="text-orange-600">Anime</span>
            </p>
            <p className="mt-2 max-w-xs text-sm text-zinc-500">
              El marketplace para comprar y vender figuras de anime entre coleccionistas,
              coordinando todo directo por WhatsApp.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Categorías
            </h3>
            <ul className="mt-3 space-y-2">
              {CATEGORIES.slice(0, 5).map((cat) => (
                <li key={cat}>
                  <Link
                    href={`/?categoria=${encodeURIComponent(cat)}`}
                    className="text-sm text-zinc-600 hover:text-orange-600"
                  >
                    {CATEGORY_ICONS[cat]} {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Información
            </h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/" className="text-sm text-zinc-600 hover:text-orange-600">
                  Explorar catálogo
                </Link>
              </li>
              <li>
                <Link href="/publicar" className="text-sm text-zinc-600 hover:text-orange-600">
                  Publicar una figura
                </Link>
              </li>
              <li>
                <Link href="/comunidad" className="text-sm text-zinc-600 hover:text-orange-600">
                  Comunidad de coleccionistas
                </Link>
              </li>
              <li>
                <Link href="/registro" className="text-sm text-zinc-600 hover:text-orange-600">
                  Crear cuenta
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-zinc-100 pt-6 text-center text-xs text-zinc-400">
          FigurasAnime © {year} — Compra y venta entre coleccionistas
        </div>
      </div>
    </footer>
  );
}
