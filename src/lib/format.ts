const soles = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

export function formatPrice(price: number) {
  return soles.format(price);
}

export function getFinalPrice(price: number, discountAmount?: number | null) {
  if (!discountAmount) return price;
  return Math.max(0, price - discountAmount);
}

export const DISCOUNT_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

// El descuento expira solo por fecha (sin tarea programada): dejamos de
// mostrarlo pasada la fecha de expiracion, aunque el campo siga en la BD.
export function getActiveDiscountAmount(
  discountAmount: number | null | undefined,
  discountExpiresAt: Date | string | null | undefined
) {
  if (!discountAmount) return null;
  if (discountExpiresAt && new Date(discountExpiresAt).getTime() <= Date.now()) return null;
  return discountAmount;
}

export function getDaysRemaining(discountExpiresAt: Date | string | null | undefined) {
  if (!discountExpiresAt) return 0;
  const msLeft = new Date(discountExpiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
}

// Porcentaje de descuento redondeado, para mostrar "-17 %".
export function discountPercent(price: number, discountAmount: number): number {
  if (price <= 0) return 0;
  return Math.round((discountAmount / price) * 100);
}
