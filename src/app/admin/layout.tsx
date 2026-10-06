import { redirect } from "next/navigation";
import { getCurrentUser, isAdmin } from "@/lib/session";
import { prisma } from "@/lib/db";
import AdminNavTabs from "@/components/admin/AdminNavTabs";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (!isAdmin(user)) {
    redirect("/");
  }

  const [pendingCategoryRequests, pendingFeatureRequests, newConsignments] = await Promise.all([
    prisma.categoryRequest.count({ where: { status: "pending" } }),
    prisma.featureRequest.count({ where: { status: "pending" } }),
    prisma.consignmentRequest.count({ where: { status: "nuevo" } }),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold text-foreground">Panel de administrador</h1>
      <div className="mt-4">
        <AdminNavTabs
          pendingCounts={{
            "/admin/categorias": pendingCategoryRequests,
            "/admin/destacados": pendingFeatureRequests,
            "/admin/consignaciones": newConsignments,
          }}
        />
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}
