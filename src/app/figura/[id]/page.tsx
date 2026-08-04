import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { formatPrice } from "@/lib/format";
import ListingGallery from "@/components/ListingGallery";
import StarRating from "@/components/StarRating";

type FiguraPageProps = {
  params: Promise<{ id: string }>;
};

export default async function FiguraPage({ params }: FiguraPageProps) {
  const { id } = await params;

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      images: true,
      user: { select: { id: true, name: true, whatsapp: true } },
    },
  });

  if (!listing) {
    notFound();
  }

  const ratingAgg = await prisma.review.aggregate({
    where: { sellerId: listing.user.id },
    _avg: { rating: true },
    _count: true,
  });
  const averageRating = ratingAgg._avg.rating ?? 0;
  const reviewCount = ratingAgg._count;

  const message = `Hola ${listing.user.name}, vi tu figura "${listing.title}" en FigurasAnime y me interesa. ¿Sigue disponible?`;
  const whatsappLink = buildWhatsAppLink(listing.user.whatsapp, message);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-800">
        &larr; Volver al catálogo
      </Link>

      <div className="mt-4 grid gap-8 sm:grid-cols-2">
        <ListingGallery images={listing.images} title={listing.title} />

        <div>
          <span className="inline-block rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
            {listing.category}
          </span>
          <h1 className="mt-3 text-2xl font-bold text-zinc-900">{listing.title}</h1>
          <p className="mt-2 text-3xl font-bold text-orange-600">
            {formatPrice(listing.price)}
          </p>

          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-zinc-700">
            {listing.description}
          </p>

          <Link
            href={`/vendedor/${listing.user.id}`}
            className="mt-4 block rounded-lg border border-zinc-200 p-3 hover:border-orange-300"
          >
            <p className="text-sm text-zinc-500">
              Vendido por{" "}
              <span className="font-medium text-zinc-900">{listing.user.name}</span>
            </p>
            <div className="mt-1">
              <StarRating rating={averageRating} reviewCount={reviewCount} />
            </div>
          </Link>

          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-green-600 px-4 py-3 text-sm font-bold text-white hover:bg-green-700"
          >
            Contactar por WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
