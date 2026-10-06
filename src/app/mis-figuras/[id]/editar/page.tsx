import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { getCategories } from "@/lib/categories";
import ListingForm from "@/components/ListingForm";
import { dateToMonth } from "@/lib/preorder";

type EditarPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditarFiguraPage({ params }: EditarPageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { images: true },
  });

  if (!listing) {
    notFound();
  }
  if (listing.userId !== user.id) {
    redirect("/mis-figuras");
  }

  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-bold text-foreground">Editar figura</h1>

      <div className="mt-8">
        <ListingForm
          mode="edit"
          listingId={listing.id}
          initialTitle={listing.title}
          initialDescription={listing.description}
          initialPrice={listing.price}
          initialCategory={listing.category}
          initialCondition={listing.condition}
          initialImages={listing.images.map((img) => ({ id: img.id, url: img.url }))}
          initialDeliveryZones={listing.deliveryZones}
          initialDeliveryNotes={listing.deliveryNotes}
          initialIsPreorder={listing.isPreorder}
          initialPreorderArrival={dateToMonth(listing.preorderArrival)}
          initialPreorderDeposit={listing.preorderDeposit}
          initialPhotoType={listing.photoType}
          categories={categories}
        />
      </div>
    </div>
  );
}
