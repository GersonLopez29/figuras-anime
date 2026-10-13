import { prisma } from "@/lib/db";

// Lo que espera una acción del admin. Lo usan el menú del panel (contadores)
// y la página Inicio.
export async function getAdminPendingCounts() {
  const [featureRequests, consignments, categoryRequests, reportedPosts] = await Promise.all([
    prisma.featureRequest.count({ where: { status: "pending" } }),
    prisma.consignmentRequest.count({ where: { status: "nuevo" } }),
    prisma.categoryRequest.count({ where: { status: "pending" } }),
    prisma.collectionPost.count({ where: { reports: { some: {} } } }),
  ]);
  return { featureRequests, consignments, categoryRequests, reportedPosts };
}
