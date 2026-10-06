import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import BlockUserButton from "@/components/admin/BlockUserButton";
import DeleteUserButton from "@/components/admin/DeleteUserButton";
import VerifyEmailButton from "@/components/admin/VerifyEmailButton";
import StoreToggleButton from "@/components/admin/StoreToggleButton";
import { OFFICIAL_STORE_NAME } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

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
      <h2 className="text-lg font-semibold text-foreground">
        Usuarios registrados ({users.length})
      </h2>

      <Card className="mt-4 gap-0 overflow-hidden py-0 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <TableHead>Nombre</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead>Figuras</TableHead>
              <TableHead>Publicaciones en comunidad</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Registrado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium text-foreground">
                  {user.name}
                  {user.role === "admin" && (
                    <Badge variant="secondary" className="ml-2">
                      admin
                    </Badge>
                  )}
                  {user.isOfficialStore && (
                    <Badge className="ml-2 bg-orange-100 text-orange-800 hover:bg-orange-100">
                      ✔ {OFFICIAL_STORE_NAME}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell className="text-muted-foreground">{user.whatsapp}</TableCell>
                <TableCell className="text-muted-foreground">{user._count.listings}</TableCell>
                <TableCell className="whitespace-normal">
                  {user._count.collectionPosts === 0 ? (
                    <span className="text-xs text-muted-foreground">Sin publicaciones</span>
                  ) : (
                    <div className="space-y-1">
                      {user.collectionPosts.map((post) => (
                        <Link
                          key={post.id}
                          href={`/comunidad/${post.id}`}
                          className="block max-w-[14rem] truncate text-xs text-primary hover:underline"
                        >
                          {post.caption}
                        </Link>
                      ))}
                      {user._count.collectionPosts > COMMUNITY_POSTS_PREVIEW && (
                        <p className="text-xs text-muted-foreground">
                          +{user._count.collectionPosts - COMMUNITY_POSTS_PREVIEW} más
                        </p>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {user.isBlocked ? (
                      <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Bloqueado</Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Activo</Badge>
                    )}
                    {!user.emailVerified && (
                      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                        Correo sin verificar
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {user.createdAt.toLocaleDateString("es-PE")}
                </TableCell>
                <TableCell>
                  {user.id === currentUser?.id ? (
                    <div className="flex items-center gap-3">
                      <StoreToggleButton userId={user.id} isOfficialStore={user.isOfficialStore} />
                      <span className="text-xs text-muted-foreground">Esta es tu cuenta</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <StoreToggleButton userId={user.id} isOfficialStore={user.isOfficialStore} />
                      <VerifyEmailButton userId={user.id} emailVerified={user.emailVerified} />
                      <BlockUserButton userId={user.id} isBlocked={user.isBlocked} />
                      <DeleteUserButton
                        userId={user.id}
                        userName={user.name}
                        listingCount={user._count.listings}
                      />
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
