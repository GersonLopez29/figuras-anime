import { prisma } from "@/lib/db";
import { FEATURE_DAYS, extendFeaturedUntil } from "@/lib/featured";

// Recompensas para animar a vender en la página. Ambas pagan en destacados
// (no en dinero), así crear cuentas falsas para cobrarlas no vale la pena.

// --- 1. Bono de bienvenida -------------------------------------------------------
// La primera figura con fotos reales de una cuenta nueva sale destacada
// WELCOME_BONUS_DAYS días gratis, al instante. Una sola vez por cuenta
// (User.welcomeBonusAt). Publicar ya exige el correo verificado.

export const WELCOME_BONUS_DAYS = FEATURE_DAYS;

// Destaca la figura y marca el bono como usado, todo junto: si dos
// publicaciones llegan a la vez, solo una se lo lleva. Devuelve hasta cuándo
// queda destacada, o null si la cuenta ya no tenía el bono.
export async function applyWelcomeBonus(userId: string, listingId: string): Promise<Date | null> {
  return prisma.$transaction(async (tx) => {
    const claimed = await tx.user.updateMany({
      where: { id: userId, welcomeBonusAt: null, isBlocked: false },
      data: { welcomeBonusAt: new Date() },
    });
    if (claimed.count !== 1) return null;
    const until = extendFeaturedUntil(null, WELCOME_BONUS_DAYS);
    // Queda registrado como un destacado aprobado de S/ 0 (igual que los
    // ganados invitando), así se ve en /admin/destacados.
    await tx.featureRequest.create({
      data: {
        listingId,
        userId,
        amount: 0,
        days: WELCOME_BONUS_DAYS,
        status: "approved",
        resolvedAt: new Date(),
      },
    });
    await tx.listing.update({ where: { id: listingId }, data: { featuredUntil: until } });
    return until;
  });
}

export async function hasWelcomeBonus(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { welcomeBonusAt: true, isBlocked: true },
  });
  return !!user && !user.welcomeBonusAt && !user.isBlocked;
}

// --- 2. Logros por ventas -------------------------------------------------------
// Al llegar a 1, 5 y 10 ventas el vendedor gana una insignia (se calcula sola
// con sus ventas) y un destacado gratis por cada logro (se entrega una vez).

export type SalesMilestone = { sales: number; icon: string; label: string };

export const SALES_MILESTONES: SalesMilestone[] = [
  { sales: 1, icon: "🥉", label: "Primera venta" },
  { sales: 5, icon: "🥈", label: "5 ventas" },
  { sales: 10, icon: "🥇", label: "10 ventas" },
];

// Para el premio solo cuentan las figuras que estuvieron publicadas al menos
// este tiempo antes de venderse: publicar y marcar "vendida" al toque no suma.
export const MILESTONE_MIN_LISTED_HOURS = 24;

// Las ventas marcadas antes de publicar esta función cuentan siempre (no había
// premio que ganar con trampas); desde entonces, solo las de figuras que
// estuvieron publicadas MILESTONE_MIN_LISTED_HOURS. El momento de lanzamiento
// es cuando terminó la migración que la agregó (Prisma lo registra en
// _prisma_migrations); si no se encuentra, no se exime ninguna venta.
const REWARDS_MIGRATION = "20261012000000_recompensas_vendedores";

// Ventas que cuentan para insignias y premios (mismas reglas para ambos, así
// la insignia no se puede conseguir marcando ventas falsas al toque).
export async function countQualifyingSales(userId: string): Promise<number> {
  const rows = await prisma.$queryRaw<{ n: bigint }[]>`
    SELECT COUNT(*) AS n FROM "Listing"
    WHERE "userId" = ${userId} AND "sold" = true
      AND ("soldAt" IS NULL
        OR "soldAt" >= "createdAt" + make_interval(hours => ${MILESTONE_MIN_LISTED_HOURS})
        OR "soldAt" < COALESCE(
          (SELECT "finished_at" AT TIME ZONE 'UTC' FROM "_prisma_migrations"
            WHERE "migration_name" = ${REWARDS_MIGRATION} AND "finished_at" IS NOT NULL
            ORDER BY "finished_at" DESC LIMIT 1),
          '-infinity'::timestamp))`;
  return Number(rows[0]?.n ?? 0);
}

// Insignia más alta alcanzada (null si aún no vendió).
export function salesBadge(sales: number): SalesMilestone | null {
  let best: SalesMilestone | null = null;
  for (const m of SALES_MILESTONES) if (sales >= m.sales) best = m;
  return best;
}

export function nextSalesMilestone(sales: number): SalesMilestone | null {
  return SALES_MILESTONES.find((m) => sales < m.sales) ?? null;
}

// Entrega los destacados de los logros que el vendedor alcanzó y aún no
// cobró. Se llama al marcar una figura como vendida. Devuelve los logros
// nuevos (vacío si no hay ninguno).
export async function claimSalesMilestones(userId: string): Promise<SalesMilestone[]> {
  const [user, qualifying] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { salesMilestoneReached: true, isBlocked: true },
    }),
    countQualifyingSales(userId),
  ]);
  if (!user || user.isBlocked) return [];

  const due = SALES_MILESTONES.filter(
    (m) => m.sales > user.salesMilestoneReached && qualifying >= m.sales
  );
  if (due.length === 0) return [];

  // Solo gana quien todavía estaba en el nivel leído: si dos ventas se marcan
  // a la vez, el premio no se entrega dos veces.
  const granted = await prisma.user.updateMany({
    where: { id: userId, salesMilestoneReached: user.salesMilestoneReached },
    data: {
      salesMilestoneReached: due[due.length - 1].sales,
      freeFeatureCredits: { increment: due.length },
    },
  });
  return granted.count === 1 ? due : [];
}
