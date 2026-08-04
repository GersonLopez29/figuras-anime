import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, isAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (!isAdmin(user)) {
    redirect("/");
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold text-zinc-900">Panel de administrador</h1>
      <nav className="mt-4 flex gap-4 border-b border-zinc-200">
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
      </nav>
      <div className="mt-6">{children}</div>
    </div>
  );
}
