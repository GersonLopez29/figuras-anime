import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import DeleteCommunityPostButton from "@/components/admin/DeleteCommunityPostButton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
      <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
        Publicaciones de comunidad ({posts.length})
        {reportedCount > 0 && (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
            {reportedCount} con reportes
          </Badge>
        )}
      </h2>

      {sorted.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Todavía no hay publicaciones.</p>
      ) : (
        <Card className="mt-4 gap-0 divide-y divide-border py-0 shadow-sm">
          {sorted.map((post) => (
            <div key={post.id} className="flex gap-4 p-4 transition hover:bg-primary/5">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
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
                    className="line-clamp-1 text-sm font-medium text-foreground hover:underline"
                  >
                    {post.caption}
                  </Link>
                  <DeleteCommunityPostButton postId={post.id} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Publicado por {post.author.name} ({post.author.email}) · {post._count.comments}{" "}
                  comentarios · {post._count.ratings} calificaciones
                </p>

                {post.reports.length > 0 && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertDescription>
                      <p className="font-semibold text-destructive">
                        🚩 {post.reports.length} reporte{post.reports.length === 1 ? "" : "s"}
                      </p>
                      <ul className="mt-1 space-y-0.5">
                        {post.reports.map((report) => (
                          <li key={report.id}>
                            <span className="font-medium">{report.reporter.name}:</span>{" "}
                            {report.reason}
                          </li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
