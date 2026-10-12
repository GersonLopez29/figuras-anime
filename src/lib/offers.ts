// "Hacer una oferta": el comprador propone un precio y se abre WhatsApp con la
// oferta escrita. El vendedor puede desactivarlo (Listing.acceptsOffers).

// No se aceptan ofertas por debajo de este porcentaje del precio: evita
// mensajes ofensivos tipo "te doy S/ 10" que solo molestan al vendedor.
export const MIN_OFFER_RATIO = 0.5;

export function minOffer(price: number): number {
  return Math.ceil(price * MIN_OFFER_RATIO);
}

// Monto sugerido para empezar: ~10 % menos, redondeado a múltiplos de 5.
export function suggestedOffer(price: number): number {
  return Math.max(minOffer(price), Math.floor((price * 0.9) / 5) * 5);
}

// null si la oferta es válida; si no, el mensaje para el comprador.
export function offerError(offer: number, price: number): string | null {
  if (!Number.isFinite(offer) || offer <= 0) return "Ingresa un monto válido";
  if (offer >= price) return "La oferta debe ser menor al precio publicado";
  if (offer < minOffer(price)) {
    return `La oferta mínima es S/ ${minOffer(price)} (la mitad del precio)`;
  }
  return null;
}
