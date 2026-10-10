import Link from "next/link";
import { permanentRedirect } from "next/navigation";
import { categoryPath } from "@/lib/slug";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getCategoriesWithCoverImage, getCategoryNames } from "@/lib/categories";
import { after } from "next/server";
import { headers } from "next/headers";
import { getCurrentUser, isAdmin } from "@/lib/session";
import { isBotUserAgent, recordSearch } from "@/lib/searchStats";
import ListingCard from "@/components/ListingCard";
import CategoryFilter from "@/components/CategoryFilter";
import ListingFilters from "@/components/ListingFilters";
import WelcomeBanner from "@/components/WelcomeBanner";
import BannerCarousel from "@/components/BannerCarousel";
import RecentlySoldBanner from "@/components/RecentlySoldBanner";
import Pagination from "@/components/Pagination";
import CatalogControls from "@/components/CatalogControls";
import StockAlertForm from "@/components/StockAlertForm";
import { cardInclude, toCardProps } from "@/lib/listingCard";
import { getTrustedSellerIds } from "@/lib/trust";
import { FEATURED_SECTION_LIMIT, activeFeaturedWhere, pickRandom } from "@/lib/featured";
import { OFFICIAL_STORE_NAME } from "@/lib/store";
import { getDeliveryZoneLabel } from "@/lib/delivery";
import { getActiveDiscountAmount } from "@/lib/format";
import {
  parseCatalogFilters,
  getProductLine,
  computePriceSummary,
  priceRangeLabel,
  ORDER_OPTIONS,
  type CatalogState,
  type ProductLineSlug,
} from "@/lib/catalog";
import {
  isLandingPage,
  landingCanonical,
  landingDescription,
  landingH1,
  landingIntro,
  landingTitle,
  type LandingInput,
} from "@/lib/catalogSeo";
import { Button } from "@/components/ui/button";

const BANNER_OFFERS_LIMIT = 3;
const BANNER_LATEST_LIMIT = 4;
const BANNER_SLIDES_LIMIT = 5;
const RECENTLY_SOLD_LIMIT = 8;
const STORE_ROW_LIMIT = 4;

const PAGE_SIZE = 24;

export type CatalogSearchParams = Promise<{
    categoria?: string;
    q?: string;
    bienvenida?: string;
    pagina?: string;
    estado?: string;
    oferta?: string;
    preventa?: string;
    orden?: string;
    min?: string;
    max?: string;
    linea?: string;
    zona?: string;
  }>;

// Portada (/) y páginas de categoría (/categoria/<slug>) comparten este
// catálogo. En una página de categoría, fixedCategory es el nombre de la
// categoría; en la portada, un ?categoria= antiguo redirige a /categoria/<slug>.
type CatalogPageProps = {
  searchParams: CatalogSearchParams;
  fixedCategory?: string;
};

// Redirección permanente de /?categoria=Nombre&... a /categoria/<slug>?...
async function redirectLegacyCategory(searchParams: CatalogSearchParams) {
  const { categoria, ...rest } = await searchParams;
  if (!categoria) return;
  const names = await getCategoryNames();
  if (!names.includes(categoria)) return;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(rest)) {
    if (typeof value === "string" && value !== "") params.set(key, value);
  }
  const qs = params.toString();
  permanentRedirect(`${categoryPath(categoria)}${qs ? `?${qs}` : ""}`);
}

// Filtro por línea (S.H.Figuarts, Ichiban Kuji…): se detecta por palabras del título.
function productLineWhere(linea: ProductLineSlug | undefined) {
  const productLine = getProductLine(linea);
  if (!productLine) return null;
  return {
    OR: [
      ...productLine.contains.map((word) => ({
        title: { contains: word, mode: "insensitive" as const },
      })),
      ...productLine.startsWith.map((word) => ({
        title: { startsWith: word, mode: "insensitive" as const },
      })),
    ],
  };
}

// Títulos, descripción y URL canónica propios por categoría, zona y línea,
// para que Google muestre "Figuras de Naruto en Lima" en vez del título genérico.
export async function catalogMetadata({
  searchParams,
  fixedCategory,
}: CatalogPageProps): Promise<Metadata> {
  // "categoria" es el parámetro antiguo: la categoría llega por fixedCategory.
  const { q, pagina, ...rawFilters } = await searchParams;
  const { linea, zona } = parseCatalogFilters(rawFilters);
  const landing: LandingInput = {
    categoria: fixedCategory,
    zona,
    linea,
  };
  const page = Math.max(1, parseInt(pagina ?? "1", 10) || 1);
  const canonical = landingCanonical(landing, page);
  // Los resultados de búsqueda por texto no se indexan (contenido duplicado y
  // casi infinito), pero Google sí sigue sus enlaces a las figuras.
  if (q?.trim()) {
    return { robots: { index: false, follow: true } };
  }

  if (!isLandingPage(landing)) {
    return { alternates: { canonical } };
  }

  const lineWhere = productLineWhere(linea);
  const stats = await prisma.listing.aggregate({
    where: {
      sold: false,
      ...(landing.categoria ? { category: landing.categoria } : {}),
      ...(zona ? { deliveryZones: { has: zona } } : {}),
      ...(lineWhere ?? {}),
    },
    _count: true,
    _min: { price: true },
    _max: { price: true },
  });
  const title = landingTitle(landing);
  const description = landingDescription(landing, {
    count: stats._count,
    lowest: stats._min.price,
    highest: stats._max.price,
  });

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "website" },
  };
}

export default async function CatalogPage({ searchParams, fixedCategory }: CatalogPageProps) {
  if (!fixedCategory) {
    await redirectLegacyCategory(searchParams);
  }
  const { q: rawQ, bienvenida, pagina, ...rawFilters } = await searchParams;
  const categoria = fixedCategory;
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
  const { estado, oferta, preventa, orden, min, max, linea, zona } =
    parseCatalogFilters(rawFilters);
  const productLine = getProductLine(linea);
  const catalogState: CatalogState = {
    categoria: category,
    q,
    estado,
    oferta,
    preventa,
    orden,
    min,
    max,
    linea,
    zona,
  };
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
    ...(productLine ? [productLineWhere(linea)!] : []),
  ];

  // El rango y el orden por precio usan el precio publicado (sin descuento).
  // Todos los filtros menos el de precio: sirve para calcular los rangos de
  // precio con las figuras que el comprador está viendo.
  const whereWithoutPrice = {
    ...(category ? { category } : {}),
    ...(zona ? { deliveryZones: { has: zona } } : {}),
    ...(estado === "nuevo" ? { condition: "nuevo" } : {}),
    ...(estado === "usado" ? { condition: { notIn: ["nuevo", "open_box"] } } : {}),
    ...(oferta ? { discountAmount: { not: null }, discountExpiresAt: { gt: new Date() } } : {}),
    ...(preventa ? { isPreorder: true } : {}),
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

  const landing: LandingInput = { categoria: category, zona, linea };
  const showLandingHeader = isLandingPage(landing) && !q;

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

  const hasFilters =
    !!category ||
    !!q ||
    !!estado ||
    oferta ||
    preventa ||
    !!linea ||
    !!zona ||
    min !== undefined ||
    max !== undefined;
  const requestedPage = Math.max(1, parseInt(pagina ?? "1", 10) || 1);
  // La portada (banner, tienda) solo se arma en la página 1 sin filtros.
  const wantsHero = !hasFilters && !orden && requestedPage === 1;
  const now = new Date();

  const listingsForPage = (pageNumber: number) =>
    prisma.listing.findMany({
      where,
      include: cardInclude,
      orderBy,
      skip: (pageNumber - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    });

  // Todas las consultas que no dependen entre sí van juntas: antes se hacían
  // una tras otra y la portada tardaba en llegar (y con ella la foto del banner).
  const [
    availablePrices,
    totalCount,
    requestedListings,
    trustedSellerIds,
    featuredCandidates,
    storeListings,
    offerListings,
    latestListings,
  ] = await Promise.all([
    // El sistema detecta la figura disponible más barata y la más cara y arma
    // los rangos de precio automáticamente; el comprador solo elige uno.
    prisma.listing.findMany({
      where: { ...whereWithoutPrice, sold: false },
      select: { price: true },
      orderBy: { price: "asc" },
    }),
    prisma.listing.count({ where }),
    listingsForPage(requestedPage),
    getTrustedSellerIds(),
    // Destacadas pagadas que coinciden con los filtros actuales: se muestran
    // arriba del catálogo (solo en la página 1), rotando el orden en cada visita.
    requestedPage === 1
      ? prisma.listing.findMany({
          where: { ...where, sold: false, ...activeFeaturedWhere(now) },
          include: cardInclude,
        })
      : Promise.resolve([]),
    // Fila "Tienda FigurasAnime" en la portada, con las figuras de la tienda oficial.
    wantsHero
      ? prisma.listing.findMany({
          where: { sold: false, user: { isOfficialStore: true } },
          include: cardInclude,
          orderBy: { createdAt: "desc" },
          take: STORE_ROW_LIMIT,
        })
      : Promise.resolve([]),
    wantsHero
      ? prisma.listing.findMany({
          where: {
            sold: false,
            discountAmount: { not: null },
            discountExpiresAt: { gt: now },
          },
          include: { images: { take: 1 } },
          orderBy: { discountExpiresAt: "asc" },
          take: BANNER_OFFERS_LIMIT,
        })
      : Promise.resolve([]),
    wantsHero
      ? prisma.listing.findMany({
          where: { sold: false },
          include: { images: { take: 1 } },
          orderBy: { createdAt: "desc" },
          take: BANNER_LATEST_LIMIT,
        })
      : Promise.resolve([]),
  ]);
  const priceSummary = computePriceSummary(availablePrices.map((l) => l.price));

  // Búsqueda anónima para el reporte "Demanda" del admin (solo la primera
  // página, sin contar al admin ni a los bots). El user-agent se lee antes:
  // dentro de after() no se puede usar headers().
  if (q && (!pagina || pagina === "1") && !isAdmin(user)) {
    const userAgent = (await headers()).get("user-agent");
    if (!isBotUserAgent(userAgent)) {
      const hadResults = availablePrices.length > 0;
      after(() => recordSearch(q, hadResults));
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  // Página pedida fuera de rango (ej. ?pagina=99): se muestra la última.
  const listings = page === requestedPage ? requestedListings : await listingsForPage(page);

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

  const showHero = wantsHero && page === 1;
  const featuredListings =
    page === 1 ? pickRandom(featuredCandidates, FEATURED_SECTION_LIMIT) : [];
  const storeSellerId = storeListings[0]?.userId;

  // El banner muestra primero las destacadas, luego ofertas y novedades.
  const featuredIds = new Set(featuredListings.map((l) => l.id));
  const offerIds = new Set(offerListings.map((l) => l.id));
  const bannerSlides = [
    ...(showHero ? featuredListings : []).map((l) => ({
      id: l.id,
      slug: l.slug,
      title: l.title,
      price: l.price,
      discountAmount: getActiveDiscountAmount(l.discountAmount, l.discountExpiresAt),
      imageUrl: l.images[0]?.url,
      isOffer: false,
      isFeatured: true,
    })),
    ...offerListings
      .filter((l) => !featuredIds.has(l.id))
      .map((l) => ({
        id: l.id,
        slug: l.slug,
        title: l.title,
        price: l.price,
        discountAmount: getActiveDiscountAmount(l.discountAmount, l.discountExpiresAt),
        imageUrl: l.images[0]?.url,
        isOffer: true,
      })),
    ...latestListings
      .filter((l) => !offerIds.has(l.id) && !featuredIds.has(l.id))
      .map((l) => ({
        id: l.id,
        slug: l.slug,
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
    slug: string | null;
    title: string;
    price: number;
    discountAmount: number | null;
    imageUrl: string;
    isOffer: boolean;
    isFeatured?: boolean;
  }[];

  const filterLabels: string[] = [];
  if (category) filterLabels.push(category);
  if (estado === "nuevo") filterLabels.push("Nuevas");
  if (estado === "usado") filterLabels.push("Usadas");
  if (oferta) filterLabels.push("En oferta");
  if (preventa) filterLabels.push("Preventas");
  if (productLine) filterLabels.push(productLine.label);
  if (zona) filterLabels.push(`📍 ${getDeliveryZoneLabel(zona)}`);
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
          slug: l.slug,
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
          <div className="relative mx-auto max-w-6xl px-4 py-8 sm:py-10">
            <div
              className={`grid items-center gap-10 ${
                bannerSlides.length > 0 ? "lg:grid-cols-2" : ""
              }`}
            >
              <div className="text-center sm:text-left">
                <p className="inline-block rounded-full bg-white/70 px-3 py-1 text-sm font-semibold uppercase tracking-wide text-red-600 shadow-sm ring-1 ring-red-100">
                  ¡Coleccionar nunca fue tan fácil!
                </p>
                <h1 className="mt-3 max-w-2xl text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl">
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
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
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
                <ol className="mt-5 flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs text-zinc-600 sm:text-sm lg:justify-start">
                  {[
                    { icon: "📸", text: "Publica con fotos" },
                    { icon: "💬", text: "Te escriben por WhatsApp" },
                    { icon: "🤝", text: "Coordinan entrega y pago" },
                  ].map((step, i) => (
                    <li key={step.text} className="flex items-center gap-1.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-orange-700 ring-1 ring-orange-200">
                        {i + 1}
                      </span>
                      <span aria-hidden="true">{step.icon}</span>
                      {step.text}
                    </li>
                  ))}
                </ol>
              </div>

              {bannerSlides.length > 0 && <BannerCarousel slides={bannerSlides} />}
            </div>
          </div>
        </section>
      )}


      {showHero && storeListings.length > 0 && (
        <section className="border-b border-zinc-200 bg-gradient-to-br from-orange-50/60 to-white">
          <div className="mx-auto max-w-6xl px-4 py-8">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-zinc-900">✔ {OFFICIAL_STORE_NAME}</h2>
                <p className="text-sm text-muted-foreground">
                  Figuras vendidas directamente por nosotros.
                </p>
              </div>
              {storeSellerId && (
                <Link
                  href={`/vendedor/${storeSellerId}`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Ver toda la tienda
                </Link>
              )}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {storeListings.map((listing) => (
                <ListingCard key={listing.id} {...toCardProps(listing, trustedSellerIds)} />
              ))}
            </div>
          </div>
        </section>
      )}


      <div id="catalogo" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-6">
        {showLandingHeader && (
          <div className="mb-6">
            <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl">
              {landingH1(landing)}
            </h1>
            <p className="mt-1.5 max-w-3xl text-sm text-zinc-600">
              {landingIntro(landing, {
                count: availablePrices.length,
                lowest: priceSummary?.lowest ?? null,
                highest: priceSummary?.highest ?? null,
              })}
            </p>
          </div>
        )}

        <CategoryFilter state={catalogState} categories={categories} />

        <div className="mt-4">
          <ListingFilters state={catalogState} />
        </div>

        <div className="mt-3">
          <CatalogControls state={catalogState} priceSummary={priceSummary} />
        </div>

        {featuredListings.length > 0 && (
          <section className="mt-6 rounded-2xl bg-amber-50/70 p-4 ring-1 ring-amber-200">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="flex items-center gap-2 text-lg font-bold text-zinc-900">
                <span aria-hidden="true">⭐</span> Destacadas
              </h2>
              {user && (
                <Link href="/mis-figuras" className="text-xs font-medium text-amber-800 hover:underline">
                  Destaca la tuya
                </Link>
              )}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {featuredListings.map((listing) => (
                <ListingCard key={listing.id} {...toCardProps(listing, trustedSellerIds)} />
              ))}
            </div>
          </section>
        )}

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
                {...toCardProps(listing, trustedSellerIds)}
                isFavorited={favoritedIds ? favoritedIds.has(listing.id) : undefined}
              />
            ))}
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} state={catalogState} />

        {showHero && (
          <div className="mt-10 flex flex-col items-start gap-3 rounded-2xl bg-white p-5 ring-1 ring-zinc-200 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-zinc-700">
              <span aria-hidden="true">📦</span>{" "}
              <strong>¿Tienes figuras que ya no usas y no tienes tiempo de venderlas?</strong>{" "}
              Nosotros las vendemos por ti.
            </p>
            <Link
              href="/te-la-vendemos"
              className="shrink-0 rounded-full border border-orange-300 px-4 py-2 text-sm font-semibold text-orange-700 transition hover:bg-orange-50"
            >
              Te la vendemos →
            </Link>
          </div>
        )}

        {q && page === totalPages && (
          <div className="mx-auto mt-10 max-w-xl rounded-2xl bg-orange-50/70 p-5 ring-1 ring-orange-200">
            <p className="font-semibold text-zinc-900">
              🔔 {listings.length === 0 ? "¿No está lo que buscas?" : "¿No encontraste la que querías?"}
            </p>
            <p className="mt-1 text-sm text-zinc-600">
              Te avisamos por correo cuando alguien publique <strong>{q}</strong>.
            </p>
            <div className="mt-3">
              <StockAlertForm
                key={q}
                defaultQuery={q}
                defaultEmail={user?.email ?? ""}
                hideQuery
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
