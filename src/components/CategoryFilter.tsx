import Link from "next/link";
import Image from "next/image";
import { catalogHref, type CatalogState } from "@/lib/catalog";

type CategoryOption = { name: string; icon: string; imageUrl?: string | null };

type CategoryFilterProps = {
  state: CatalogState;
  categories: CategoryOption[];
};

// Al cambiar de categoría se conservan los demás filtros (búsqueda, estado,
// línea, precio y orden); la búsqueda nueva, en cambio, empieza desde cero.
export default function CategoryFilter({ state, categories }: CategoryFilterProps) {
  const { categoria: activeCategory, q } = state;
  // Solo categorías con figuras disponibles (todas con foto, así se ven
  // parejas); la categoría activa se muestra siempre aunque esté vacía.
  const visible = categories.filter((c) => c.imageUrl || c.name === activeCategory);
  return (
    <div className="space-y-5">
      {/* En pantallas grandes el buscador está en la barra de arriba. */}
      <form action="/" method="get" className="flex gap-2 xl:hidden">
        <div className="relative w-full max-w-md">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/70">
            🔍
          </span>
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Buscar figuras (ej: Goku, Naruto...)"
            className="w-full rounded-full border border-input py-2.5 pl-10 pr-4 text-sm focus:border-orange-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="rounded-full bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
        >
          Buscar
        </button>
      </form>

      <div className="no-scrollbar flex gap-5 overflow-x-auto pb-1">
        <Link
          href={catalogHref({ ...state, categoria: undefined })}
          className="group flex shrink-0 flex-col items-center gap-1.5"
        >
          <span
            className={`flex h-16 w-16 items-center justify-center rounded-full text-2xl ring-1 transition group-hover:scale-105 ${
              !activeCategory
                ? "bg-primary text-primary-foreground ring-primary ring-offset-2 ring-offset-background"
                : "bg-orange-50 dark:bg-orange-950/40 text-foreground/80 ring-orange-200 dark:ring-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/40"
            }`}
          >
            🗂️
          </span>
          <span className="text-xs font-medium text-foreground/80">Todas</span>
        </Link>
        {visible.map((cat) => {
          const active = activeCategory === cat.name;
          return (
            <Link
              key={cat.name}
              href={catalogHref({ ...state, categoria: cat.name })}
              className="group flex shrink-0 flex-col items-center gap-1.5"
            >
              <span
                className={`relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full text-2xl transition group-hover:scale-105 ${
                  active ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "ring-1 ring-black/5"
                } ${
                  cat.imageUrl
                    ? "bg-muted"
                    : active
                      ? "bg-orange-600 text-white"
                      : "bg-orange-50 dark:bg-orange-950/40 text-foreground/80 hover:bg-orange-100 dark:hover:bg-orange-900/40"
                }`}
              >
                {cat.imageUrl ? (
                  <Image src={cat.imageUrl} alt="" fill sizes="64px" className="object-cover" />
                ) : (
                  cat.icon
                )}
              </span>
              <span className="max-w-[4.5rem] text-center text-xs font-medium text-foreground/80">
                {cat.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
