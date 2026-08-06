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
