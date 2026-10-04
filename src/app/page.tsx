import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCategoriesWithCoverImage } from "@/lib/categories";
import { getCurrentUser } from "@/lib/session";
import ListingCard from "@/components/ListingCard";
import CategoryFilter from "@/components/CategoryFilter";
import ListingFilters from "@/components/ListingFilters";
import WelcomeBanner from "@/components/WelcomeBanner";
import BannerCarousel from "@/components/BannerCarousel";
import RecentlySoldBanner from "@/components/RecentlySoldBanner";
import Pagination from "@/components/Pagination";
import CatalogControls from "@/components/CatalogControls";
import { getActiveDiscountAmount } from "@/lib/format";
import {
  parseCatalogFilters,
  getProductLine,
  computePriceSummary,
  priceRangeLabel,
  ORDER_OPTIONS,
  type CatalogState,
} from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const BANNER_OFFERS_LIMIT = 3;
const BANNER_LATEST_LIMIT = 4;
const BANNER_SLIDES_LIMIT = 5;
const RECENTLY_SOLD_LIMIT = 8;

const PAGE_SIZE = 24;

type HomeProps = {
  searchParams: Promise<{
    categoria?: string;
    q?: string;
    bienvenida?: string;
    pagina?: string;
    estado?: string;
    oferta?: string;
    orden?: string;
    min?: string;
    max?: string;
    linea?: string;
  }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const { categoria, q: rawQ, bienvenida, pagina, ...rawFilters } = await searchParams;
  const q = rawQ?.trim() || undefined;
  const [categories, user, recentlySold] = await Promise.all([
    getCategoriesWithCoverImage(),
    getCurrentUser(),
    prisma.listing.findMany({
      where: { sold: true },
      include: { images: { take: 1 } },
      orderBy: { updatedAt: "desc" },
      take: RECENTLY_SOLD_LIMIT,
    }),
  ]);
  const category = categories.some((c) => c.name === categoria) ? categoria : undefined;
  const { estado, oferta, orden, min, max, linea } = parseCatalogFilters(rawFilters);
  const productLine = getProductLine(linea);
  const catalogState: CatalogState = { categoria: category, q, estado, oferta, orden, min, max, linea };
  const sellCtaHref = user ? "/publicar" : "/registro";

  // Las búsquedas por texto no distinguen mayúsculas ("goku" encuentra "GOKU").
  const textFilters = [
    ...(q
      ? [
          {
            OR: [
              { title: { contains: q, mode: "insensitive" as const } },
              { description: { contains: q, mode: "insensitive" as const } },
            ],
          },
        ]
      : []),
    ...(productLine
      ? [
          {
            OR: [
              ...productLine.contains.map((word) => ({
                title: { contains: word, mode: "insensitive" as const },
              })),
              ...productLine.startsWith.map((word) => ({
                title: { startsWith: word, mode: "insensitive" as const },
              })),
            ],
          },
        ]
      : []),
  ];

  // El rango y el orden por precio usan el precio publicado (sin descuento).
  // Todos los filtros menos el de precio: sirve para calcular los rangos de
  // precio con las figuras que el comprador está viendo.
  const whereWithoutPrice = {
    ...(category ? { category } : {}),
    ...(estado === "nuevo" ? { condition: "nuevo" } : {}),
    ...(estado === "usado" ? { condition: { notIn: ["nuevo", "open_box"] } } : {}),
    ...(oferta ? { discountAmount: { not: null }, discountExpiresAt: { gt: new Date() } } : {}),
    ...(textFilters.length > 0 ? { AND: textFilters } : {}),
  };

  const where = {
    ...whereWithoutPrice,
    ...(min !== undefined || max !== undefined
      ? {
          price: {
            ...(min !== undefined ? { gte: min } : {}),
            ...(max !== undefined ? { lte: max } : {}),
          },
        }
      : {}),
  };

  // El sistema detecta la figura disponible más barata y la más cara y arma
  // los rangos de precio automáticamente; el comprador solo elige uno.
  const availablePrices = await prisma.listing.findMany({
    where: { ...whereWithoutPrice, sold: false },
    select: { price: true },
    orderBy: { price: "asc" },
  });
  const priceSummary = computePriceSummary(availablePrices.map((l) => l.price));

  const orderBy = [
    { sold: "asc" as const },
    ...(orden === "precio_asc"
      ? [{ price: "asc" as const }]
      : orden === "precio_desc"
        ? [{ price: "desc" as const }]
        : orden === "vistas"
          ? [{ views: "desc" as const }]
          : []),
    { createdAt: "desc" as const },
  ];

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
    orderBy,
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

  const hasFilters =
    !!category || !!q || !!estado || oferta || !!linea || min !== undefined || max !== undefined;
  const showHero = !hasFilters && !orden && page === 1;

  const [offerListings, latestListings] = showHero
    ? await Promise.all([
        prisma.listing.findMany({
          where: {
            sold: false,
            discountAmount: { not: null },
            discountExpiresAt: { gt: new Date() },
          },
          include: { images: { take: 1 } },
          orderBy: { discountExpiresAt: "asc" },
          take: BANNER_OFFERS_LIMIT,
        }),
        prisma.listing.findMany({
          where: { sold: false },
          include: { images: { take: 1 } },
          orderBy: { createdAt: "desc" },
          take: BANNER_LATEST_LIMIT,
        }),
      ])
    : [[], []];

  const offerIds = new Set(offerListings.map((l) => l.id));
  const bannerSlides = [
    ...offerListings.map((l) => ({
      id: l.id,
      title: l.title,
      price: l.price,
      discountAmount: getActiveDiscountAmount(l.discountAmount, l.discountExpiresAt),
      imageUrl: l.images[0]?.url,
      isOffer: true,
    })),
    ...latestListings
      .filter((l) => !offerIds.has(l.id))
      .map((l) => ({
        id: l.id,
        title: l.title,
        price: l.price,
        discountAmount: null as number | null,
        imageUrl: l.images[0]?.url,
        isOffer: false,
      })),
  ]
    .filter((s) => !!s.imageUrl)
    .slice(0, BANNER_SLIDES_LIMIT) as {
    id: string;
    title: string;
    price: number;
    discountAmount: number | null;
    imageUrl: string;
    isOffer: boolean;
  }[];

  const filterLabels: string[] = [];
  if (category) filterLabels.push(category);
  if (estado === "nuevo") filterLabels.push("Nuevas");
  if (estado === "usado") filterLabels.push("Usadas");
  if (oferta) filterLabels.push("En oferta");
  if (productLine) filterLabels.push(productLine.label);
  const activePriceLabel = priceRangeLabel(min, max);
  if (activePriceLabel) filterLabels.push(activePriceLabel);
  if (q) filterLabels.push(`"${q}"`);
  const heading =
    filterLabels.length > 0
      ? filterLabels.join(" · ")
      : orden
        ? (ORDER_OPTIONS.find((o) => o.value === orden)?.label ?? "Catálogo")
        : "Recién publicadas";

  return (
    <div>
      <RecentlySoldBanner
        items={recentlySold.map((l) => ({
          id: l.id,
          title: l.title,
          price: l.price,
          imageUrl: l.images[0]?.url,
        }))}
      />

      {bienvenida && <WelcomeBanner name={bienvenida} />}

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
          <div className="relative mx-auto max-w-6xl px-4 py-12 sm:py-16">
            <div
              className={`grid items-center gap-10 ${
                bannerSlides.length > 0 ? "lg:grid-cols-2" : ""
              }`}
            >
              <div className="text-center sm:text-left">
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
                <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                  <Button
                    render={<a href={sellCtaHref} />}
                    nativeButton={false}
                    size="lg"
                    className="rounded-full bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-red-600/20 transition hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-lg"
                  >
                    Empieza a vender
                  </Button>
                  <Button
                    render={<a href="#catalogo" />}
                    nativeButton={false}
                    variant="outline"
                    size="lg"
                    className="rounded-full border-orange-300 bg-white px-6 py-3 text-sm font-bold text-orange-700 transition hover:-translate-y-0.5 hover:bg-orange-100"
                  >
                    Explorar catálogo
                  </Button>
                </div>
              </div>

              {bannerSlides.length > 0 && <BannerCarousel slides={bannerSlides} />}
            </div>
          </div>
        </section>
      )}

      {showHero && (
        <section className="border-b border-zinc-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-6">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { icon: "📸", title: "1. Publica", text: "Sube fotos de tu figura, ponle precio y categoría." },
                { icon: "💬", title: "2. Conecta", text: "Los interesados te escriben directo a tu WhatsApp." },
                { icon: "🤝", title: "3. Vende", text: "Coordinan la entrega y el pago entre ustedes." },
              ].map((step) => (
                <Card key={step.title} className="flex-row items-center gap-4 p-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-100 to-red-50 text-xl ring-1 ring-orange-100">
                    {step.icon}
                  </span>
                  <div>
                    <h3 className="font-semibold text-foreground">{step.title}</h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">{step.text}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      <div id="catalogo" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-8">
        <CategoryFilter state={catalogState} categories={categories} />

        <div className="mt-4">
          <ListingFilters state={catalogState} />
        </div>

        <div className="mt-3">
          <CatalogControls state={catalogState} priceSummary={priceSummary} />
        </div>

        <div className="mt-6 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="flex items-center gap-2 text-lg font-bold text-zinc-900">
            <span aria-hidden="true">🔥</span>
            {heading}
          </h2>
          <p className="text-sm text-muted-foreground">
            {totalCount} {totalCount === 1 ? "figura" : "figuras"}
          </p>
        </div>

        {listings.length === 0 ? (
          <div className="mt-16 text-center">
            <p className="text-sm text-zinc-400">No hay figuras publicadas todavía con ese criterio.</p>
            {hasFilters && (
              <Link href="/#catalogo" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
                Quitar filtros
              </Link>
            )}
          </div>
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

        <Pagination page={page} totalPages={totalPages} state={catalogState} />
      </div>
    </div>
  );
}
