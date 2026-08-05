import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getCategories } from "@/lib/categories";
import ListingForm from "@/components/ListingForm";

export default async function PublicarPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-bold text-zinc-900">Publicar una figura</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Los compradores te contactarán por WhatsApp al número{" "}
        <span className="font-medium text-zinc-700">{user.whatsapp}</span>.
      </p>

      <div className="mt-8">
        <ListingForm mode="create" categories={categories} />
      </div>
    </div>
  );
}
