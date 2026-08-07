import { prisma } from "@/lib/db";
import { getCategories } from "@/lib/categories";
import { getCurrentUser } from "@/lib/session";
import ListingCard from "@/components/ListingCard";
import CategoryFilter from "@/components/CategoryFilter";
import ListingFilters from "@/components/ListingFilters";
import WelcomeBanner from "@/components/WelcomeBanner";
import BannerCarousel from "@/components/BannerCarousel";
import Pagination from "@/components/Pagination";
import { getActiveDiscountAmount } from "@/lib/format";

const PAGE_SIZE = 24;

type HomeProps = {
  searchParams: Promise<{
    categoria?: string;
    q?: string;
    bienvenida?: string;
    pagina?: string;
    estado?: string;
    oferta?: string;
  }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const { categoria, q, bienvenida, pagina, estado: rawEstado, oferta: rawOferta } =
    await searchParams;
  const [categories, user] = await Promise.all([getCategories(), getCurrentUser()]);
  const category = categories.some((c) => c.name === categoria) ? categoria : undefined;
  const estado = rawEstado === "nuevo" || rawEstado === "usado" ? rawEstado : undefined;
  const oferta = rawOferta === "1";
  const sellCtaHref = user ? "/publicar" : "/registro";

  const where = {
    ...(category ? { category } : {}),
    ...(estado === "nuevo" ? { condition: "nuevo" } : {}),
    ...(estado === "usado" ? { condition: { notIn: ["nuevo", "open_box"] } } : {}),
    ...(oferta ? { discountAmount: { not: null }, discountExpiresAt: { gt: new Date() } } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q } },
            { description: { contains: q } },
          ],
        }
      : {}),
  };

  const totalCount = await prisma.listing.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const requestedPage = Math.max(1, parseInt(pagina ?? "1", 10) || 1);
  const page = Math.min(requestedPage, totalPages);

  const listings = await prisma.listing.findMany({
    where,
    include: {
      images: { take: 1 },
      user: { select: { name: true } },
    },
    orderBy: [{ sold: "asc" }, { createdAt: "desc" }],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  const favoritedIds = user
    ? new Set(
        (
          await prisma.favorite.findMany({
            where: { userId: user.id, listingId: { in: listings.map((l) => l.id) } },
            select: { listingId: true },
          })
        ).map((f) => f.listingId)
      )
    : null;

  const showHero = !category && !q && !estado && !oferta && page === 1;

  const filterLabels: string[] = [];
  if (category) filterLabels.push(category);
  if (estado === "nuevo") filterLabels.push("Nuevas");
  if (estado === "usado") filterLabels.push("Usadas");
  if (oferta) filterLabels.push("En oferta");
  if (q) filterLabels.push(`"${q}"`);
  const heading = filterLabels.length > 0 ? filterLabels.join(" · ") : "Recién publicadas";

  return (
    <div>
      {bienvenida && <WelcomeBanner name={bienvenida} />}

      {showHero && <BannerCarousel />}

      {showHero && (
        <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-orange-50 to-red-50">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-orange-200/40 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-red-200/30 blur-3xl"
          />
          <div className="relative mx-auto max-w-6xl px-4 py-16 text-center sm:text-left">
            <p className="inline-block rounded-full bg-white/70 px-3 py-1 text-sm font-semibold uppercase tracking-wide text-red-600 shadow-sm ring-1 ring-red-100">
              ¡Coleccionar nunca fue tan fácil!
            </p>
            <h1 className="mt-4 max-w-2xl text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl">
              Compra y vende{" "}
              <span className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                figuras de anime
              </span>
            </h1>
            <p className="mt-4 max-w-xl text-sm text-zinc-600 sm:text-base">
              Naruto, Dragon Ball Z, One Piece y muchas más. Publica las figuras que ya
              no usas o encuentra tu próxima pieza de colección, y coordina todo directo
              por WhatsApp.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a
                href={sellCtaHref}
                className="inline-block rounded-full bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-red-600/20 transition hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-lg"
              >
                Empieza a vender
              </a>
              <a
                href="#catalogo"
                className="inline-block rounded-full border border-orange-300 bg-white px-6 py-3 text-sm font-bold text-orange-700 transition hover:-translate-y-0.5 hover:bg-orange-100"
              >
                Explorar catálogo
              </a>
            </div>
          </div>
        </section>
      )}

      {showHero && (
        <section className="border-b border-zinc-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-10">
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { icon: "📸", title: "1. Publica", text: "Sube fotos de tu figura, ponle precio y categoría." },
                { icon: "💬", title: "2. Conecta", text: "Los interesados te escriben directo a tu WhatsApp." },
                { icon: "🤝", title: "3. Vende", text: "Coordinan la entrega y el pago entre ustedes." },
              ].map((step) => (
                <div
                  key={step.title}
                  className="flex flex-col items-center rounded-2xl border border-zinc-100 p-5 text-center transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md sm:items-start sm:text-left"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-orange-100 to-red-50 text-2xl ring-1 ring-orange-100">
                    {step.icon}
                  </span>
                  <h3 className="mt-3 font-semibold text-zinc-900">{step.title}</h3>
                  <p className="mt-1 text-sm text-zinc-500">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <div id="catalogo" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-8">
        <CategoryFilter activeCategory={category} q={q} categories={categories} />

        <div className="mt-4">
          <ListingFilters estado={estado} oferta={oferta} category={category} q={q} />
        </div>

        <h2 className="mt-6 flex items-center gap-2 text-lg font-bold text-zinc-900">
          <span aria-hidden="true">🔥</span>
          {heading}
        </h2>

        {listings.length === 0 ? (
          <p className="mt-16 text-center text-sm text-zinc-400">
            No hay figuras publicadas todavía con ese criterio.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                id={listing.id}
                title={listing.title}
                price={listing.price}
                discountAmount={getActiveDiscountAmount(listing.discountAmount, listing.discountExpiresAt)}
                category={listing.category}
                condition={listing.condition}
                imageUrl={listing.images[0]?.url}
                sellerName={listing.user.name}
                sold={listing.sold}
                views={listing.views}
                isFavorited={favoritedIds ? favoritedIds.has(listing.id) : undefined}
              />
            ))}
          </div>
        )}

        <Pagination
          page={page}
          totalPages={totalPages}
          categoria={category}
          q={q}
          estado={estado}
          oferta={oferta}
        />
      </div>
    </div>
  );
}
