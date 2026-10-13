import Link from "next/link";
import Image from "next/image";
import { MessagesSquare } from "lucide-react";
import { prisma } from "@/lib/db";
import DeleteCommunityPostButton from "@/components/admin/DeleteCommunityPostButton";
import DismissReportsButton from "@/components/admin/DismissReportsButton";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AdminEmpty, AdminFilterChips, AdminPageHeader } from "@/components/admin/AdminUi";

const BASE = "/admin/comunidad";

type Props = { searchParams: Promise<{ filtro?: string }> };

export default async function AdminComunidadPage({ searchParams }: Props) {
  const onlyReported = (await searchParams).filtro === "reportadas";

  const posts = await prisma.collectionPost.findMany({
    where: onlyReported ? { reports: { some: {} } } : undefined,
    include: {
      images: { take: 1 },
      author: { select: { name: true, email: true } },
      reports: { include: { reporter: { select: { name: true } } } },
      _count: { select: { comments: true, ratings: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  const [total, reportedCount] = await Promise.all([
    prisma.collectionPost.count(),
    prisma.collectionPost.count({ where: { reports: { some: {} } } }),
  ]);

  // Las reportadas siempre primero.
  const sorted = [...posts].sort((a, b) => b.reports.length - a.reports.length);

  return (
    <div>
      <AdminPageHeader
        icon={MessagesSquare}
        title="Comunidad"
        description="Publicaciones de las colecciones de los usuarios. Las reportadas aparecen primero: elimínalas o, si están bien, quítales el reporte."
      />

      <div className="mb-4">
        <AdminFilterChips
          basePath={BASE}
          param="filtro"
          active={onlyReported ? "reportadas" : "todas"}
          current={{ filtro: onlyReported ? "reportadas" : undefined }}
          label="Filtrar publicaciones"
          filters={[
            { value: "todas", label: "Todas", count: total },
            { value: "reportadas", label: "🚩 Reportadas", count: reportedCount },
          ]}
        />
      </div>

      {sorted.length === 0 ? (
        <AdminEmpty>
          {onlyReported ? "No hay publicaciones reportadas. 🎉" : "Todavía no hay publicaciones."}
        </AdminEmpty>
      ) : (
        <Card className="gap-0 divide-y divide-border py-0 shadow-sm">
          {sorted.map((post) => (
            <div key={post.id} className="flex gap-4 p-4 transition hover:bg-primary/5">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                {post.images[0] ? (
                  <Image
                    src={post.images[0].url}
                    alt={post.caption}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : null}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/comunidad/${post.id}`}
                    className="line-clamp-2 text-sm font-medium text-foreground hover:underline"
                  >
                    {post.caption}
                  </Link>
                  <DeleteCommunityPostButton postId={post.id} />
                </div>
                <p className="break-words text-xs text-muted-foreground">
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
                      <div className="mt-2">
                        <DismissReportsButton postId={post.id} />
                      </div>
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
