import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import DeleteCommunityPostButton from "@/components/admin/DeleteCommunityPostButton";

export default async function AdminComunidadPage() {
  const posts = await prisma.collectionPost.findMany({
    include: {
      images: { take: 1 },
      author: { select: { name: true, email: true } },
      reports: { include: { reporter: { select: { name: true } } } },
      _count: { select: { comments: true, ratings: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const sorted = [...posts].sort((a, b) => b.reports.length - a.reports.length);
  const reportedCount = sorted.filter((p) => p.reports.length > 0).length;

  return (
    <div>
      <h2 className="text-lg font-semibold text-zinc-900">
        Publicaciones de comunidad ({posts.length})
        {reportedCount > 0 && (
          <span className="ml-2 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
            {reportedCount} con reportes
          </span>
        )}
      </h2>

      {sorted.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">Todavía no hay publicaciones.</p>
      ) : (
        <div className="mt-4 divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
          {sorted.map((post) => (
            <div key={post.id} className="flex gap-4 p-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-zinc-100">
                {post.images[0] ? (
                  <Image
                    src={post.images[0].url}
                    alt={post.caption}
                    fill
                    className="object-cover"
                  />
                ) : null}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <Link
                    href={`/comunidad/${post.id}`}
                    className="line-clamp-1 text-sm font-medium text-zinc-900 hover:underline"
                  >
                    {post.caption}
                  </Link>
                  <DeleteCommunityPostButton postId={post.id} />
                </div>
                <p className="text-xs text-zinc-400">
                  Publicado por {post.author.name} ({post.author.email}) · {post._count.comments}{" "}
                  comentarios · {post._count.ratings} calificaciones
                </p>

                {post.reports.length > 0 && (
                  <div className="mt-2 rounded-md bg-red-50 p-2">
                    <p className="text-xs font-semibold text-red-700">
                      🚩 {post.reports.length} reporte{post.reports.length === 1 ? "" : "s"}
                    </p>
                    <ul className="mt-1 space-y-0.5">
                      {post.reports.map((report) => (
                        <li key={report.id} className="text-xs text-red-600">
                          <span className="font-medium">{report.reporter.name}:</span>{" "}
                          {report.reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
