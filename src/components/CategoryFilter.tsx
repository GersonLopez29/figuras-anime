import Link from "next/link";
import { CATEGORIES, CATEGORY_ICONS } from "@/lib/categories";

type CategoryFilterProps = {
  activeCategory?: string;
  q?: string;
};

export default function CategoryFilter({ activeCategory, q }: CategoryFilterProps) {
  return (
    <div className="space-y-5">
      <form action="/" method="get" className="flex gap-2">
        <div className="relative w-full max-w-md">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
            🔍
          </span>
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Buscar figuras (ej: Goku, Naruto...)"
            className="w-full rounded-full border border-zinc-300 py-2.5 pl-10 pr-4 text-sm focus:border-orange-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="rounded-full bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
        >
          Buscar
        </button>
      </form>

      <div className="flex gap-5 overflow-x-auto pb-1">
        <Link
          href={q ? `/?q=${encodeURIComponent(q)}` : "/"}
          className="flex shrink-0 flex-col items-center gap-1.5"
        >
          <span
            className={`flex h-16 w-16 items-center justify-center rounded-full text-2xl ${
              !activeCategory
                ? "bg-orange-600 text-white"
                : "bg-orange-50 text-zinc-700 hover:bg-orange-100"
            }`}
          >
            🗂️
          </span>
          <span className="text-xs font-medium text-zinc-700">Todas</span>
        </Link>
        {CATEGORIES.map((cat) => {
          const params = new URLSearchParams();
          params.set("categoria", cat);
          if (q) params.set("q", q);
          const active = activeCategory === cat;
          return (
            <Link
              key={cat}
              href={`/?${params.toString()}`}
              className="flex shrink-0 flex-col items-center gap-1.5"
            >
              <span
                className={`flex h-16 w-16 items-center justify-center rounded-full text-2xl ${
                  active
                    ? "bg-orange-600 text-white"
                    : "bg-orange-50 text-zinc-700 hover:bg-orange-100"
                }`}
              >
                {CATEGORY_ICONS[cat]}
              </span>
              <span className="max-w-[4.5rem] text-center text-xs font-medium text-zinc-700">
                {cat}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
