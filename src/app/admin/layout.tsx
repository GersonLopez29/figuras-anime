import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, isAdmin } from "@/lib/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (!isAdmin(user)) {
    redirect("/");
  }

  const pendingCategoryRequests = await prisma.categoryRequest.count({
    where: { status: "pending" },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold text-zinc-900">Panel de administrador</h1>
      <nav className="mt-4 flex gap-4 overflow-x-auto border-b border-zinc-200">
        <Link
          href="/admin/usuarios"
          className="border-b-2 border-transparent px-1 pb-3 text-sm font-medium text-zinc-600 hover:border-orange-600 hover:text-zinc-900"
        >
          Usuarios
        </Link>
        <Link
          href="/admin/publicaciones"
          className="border-b-2 border-transparent px-1 pb-3 text-sm font-medium text-zinc-600 hover:border-orange-600 hover:text-zinc-900"
        >
          Publicaciones
        </Link>
        <Link
          href="/admin/comunidad"
          className="border-b-2 border-transparent px-1 pb-3 text-sm font-medium text-zinc-600 hover:border-orange-600 hover:text-zinc-900"
        >
          Comunidad
        </Link>
        <Link
          href="/admin/categorias"
          className="flex items-center gap-1.5 border-b-2 border-transparent px-1 pb-3 text-sm font-medium text-zinc-600 hover:border-orange-600 hover:text-zinc-900"
        >
          Categorías
          {pendingCategoryRequests > 0 && (
            <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-xs font-semibold text-orange-700">
              {pendingCategoryRequests}
            </span>
          )}
        </Link>
      </nav>
      <div className="mt-6">{children}</div>
    </div>
  );
}
