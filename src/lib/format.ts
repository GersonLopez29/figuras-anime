const soles = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

export function formatPrice(price: number) {
  return soles.format(price);
}
