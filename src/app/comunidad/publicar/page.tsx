import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import CommunityPostForm from "@/components/CommunityPostForm";

export default async function PublicarComunidadPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-bold text-zinc-900">Muestra tu colección</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Sube fotos de tus figuras, otros coleccionistas podrán comentarlas y calificarlas.
      </p>

      <div className="mt-8">
        <CommunityPostForm />
      </div>
    </div>
  );
}
