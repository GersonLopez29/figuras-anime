import { redirect } from "next/navigation";
import { getCurrentUser, isAdmin } from "@/lib/session";
import { getAdminPendingCounts } from "@/lib/adminPending";
import { AdminMobileNav, AdminSidebar } from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (!isAdmin(user)) {
    redirect("/");
  }

  const pending = await getAdminPendingCounts();
  const pendingCounts = {
    "/admin/destacados": pending.featureRequests,
    "/admin/consignaciones": pending.consignments,
    "/admin/categorias": pending.categoryRequests,
    "/admin/comunidad": pending.reportedPosts,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:py-10">
      <div className="mb-6 lg:hidden">
        <AdminMobileNav pendingCounts={pendingCounts} />
      </div>
      <div className="lg:grid lg:grid-cols-[13.5rem_minmax(0,1fr)] lg:gap-10">
        <aside className="hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pb-6">
            <p className="mb-4 px-3 text-lg font-bold text-foreground">Panel admin</p>
            <AdminSidebar pendingCounts={pendingCounts} />
          </div>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
