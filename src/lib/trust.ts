import { cache } from "react";
import { prisma } from "@/lib/db";

// Insignia "🏅 Vendedor confiable": se gana sola al cumplir todo esto.
export const TRUST_MIN_SALES = 5;
export const TRUST_MIN_REVIEWS = 2;
export const TRUST_MIN_RATING = 4;
export const TRUST_MIN_ACCOUNT_DAYS = 30;

export type TrustProgress = {
  sales: number;
  reviews: number;
  rating: number;
  accountDays: number;
  trusted: boolean;
};

function evaluate(sales: number, reviews: number, rating: number, accountDays: number): boolean {
  return (
    sales >= TRUST_MIN_SALES &&
    reviews >= TRUST_MIN_REVIEWS &&
    rating >= TRUST_MIN_RATING &&
    accountDays >= TRUST_MIN_ACCOUNT_DAYS
  );
}

function daysSince(date: Date, now = new Date()) {
  return Math.floor((now.getTime() - date.getTime()) / (24 * 60 * 60 * 1000));
}

// Todos los vendedores con la insignia (una consulta por página, compartida
// entre todas las tarjetas del catálogo).
export const getTrustedSellerIds = cache(async (): Promise<Set<string>> => {
  const salesBySeller = await prisma.listing.groupBy({
    by: ["userId"],
    where: { sold: true },
    _count: { _all: true },
  });
  const candidates = salesBySeller
    .filter((s) => s._count._all >= TRUST_MIN_SALES)
    .map((s) => s.userId);
  if (candidates.length === 0) return new Set();

  const accountCutoff = new Date(Date.now() - TRUST_MIN_ACCOUNT_DAYS * 24 * 60 * 60 * 1000);
  const [reviews, users] = await Promise.all([
    prisma.review.groupBy({
      by: ["sellerId"],
      where: { sellerId: { in: candidates } },
      _count: { _all: true },
      _avg: { rating: true },
    }),
    prisma.user.findMany({
      where: { id: { in: candidates }, isBlocked: false, createdAt: { lte: accountCutoff } },
      select: { id: true },
    }),
  ]);
  const oldEnough = new Set(users.map((u) => u.id));

  return new Set(
    reviews
      .filter(
        (r) =>
          oldEnough.has(r.sellerId) &&
          r._count._all >= TRUST_MIN_REVIEWS &&
          (r._avg.rating ?? 0) >= TRUST_MIN_RATING
      )
      .map((r) => r.sellerId)
  );
});

// Avance de un vendedor hacia la insignia (para su perfil y "Mis figuras").
export async function getTrustProgress(userId: string): Promise<TrustProgress | null> {
  const [user, sales, reviewAgg] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true } }),
    prisma.listing.count({ where: { userId, sold: true } }),
    prisma.review.aggregate({ where: { sellerId: userId }, _count: true, _avg: { rating: true } }),
  ]);
  if (!user) return null;
  const reviews = reviewAgg._count;
  const rating = reviewAgg._avg.rating ?? 0;
  const accountDays = daysSince(user.createdAt);
  return { sales, reviews, rating, accountDays, trusted: evaluate(sales, reviews, rating, accountDays) };
}
