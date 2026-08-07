import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import BlockUserButton from "@/components/admin/BlockUserButton";
import DeleteUserButton from "@/components/admin/DeleteUserButton";

const COMMUNITY_POSTS_PREVIEW = 3;

export default async function AdminUsuariosPage() {
  const currentUser = await getCurrentUser();

  const users = await prisma.user.findMany({
    include: {
      _count: { select: { listings: true, collectionPosts: true } },
      collectionPosts: {
        select: { id: true, caption: true },
        orderBy: { createdAt: "desc" },
        take: COMMUNITY_POSTS_PREVIEW,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h2 className="text-lg font-semibold text-zinc-900">
        Usuarios registrados ({users.length})
      </h2>

      <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Correo</th>
              <th className="px-4 py-3">WhatsApp</th>
              <th className="px-4 py-3">Figuras</th>
              <th className="px-4 py-3">Publicaciones en comunidad</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Registrado</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-3 font-medium text-zinc-900">
                  {user.name}
                  {user.role === "admin" && (
                    <span className="ml-2 rounded bg-orange-100 px-1.5 py-0.5 text-xs font-medium text-orange-700">
                      admin
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-zinc-600">{user.email}</td>
                <td className="px-4 py-3 text-zinc-600">{user.whatsapp}</td>
                <td className="px-4 py-3 text-zinc-600">{user._count.listings}</td>
                <td className="px-4 py-3">
                  {user._count.collectionPosts === 0 ? (
                    <span className="text-xs text-zinc-400">Sin publicaciones</span>
                  ) : (
                    <div className="space-y-1">
                      {user.collectionPosts.map((post) => (
                        <Link
                          key={post.id}
                          href={`/comunidad/${post.id}`}
                          className="block max-w-[14rem] truncate text-xs text-orange-600 hover:underline"
                        >
                          {post.caption}
                        </Link>
                      ))}
                      {user._count.collectionPosts > COMMUNITY_POSTS_PREVIEW && (
                        <p className="text-xs text-zinc-400">
                          +{user._count.collectionPosts - COMMUNITY_POSTS_PREVIEW} más
                        </p>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  {user.isBlocked ? (
                    <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                      Bloqueado
                    </span>
                  ) : (
                    <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      Activo
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-zinc-500">
                  {user.createdAt.toLocaleDateString("es-PE")}
                </td>
                <td className="px-4 py-3">
                  {user.id === currentUser?.id ? (
                    <span className="text-xs text-zinc-400">Esta es tu cuenta</span>
                  ) : (
                    <div className="flex items-center gap-3">
                      <BlockUserButton userId={user.id} isBlocked={user.isBlocked} />
                      <DeleteUserButton
                        userId={user.id}
                        userName={user.name}
                        listingCount={user._count.listings}
                      />
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
