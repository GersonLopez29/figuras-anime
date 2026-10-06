// "Se busca": los pedidos se muestran y generan avisos durante 60 días.
export const WANTED_ACTIVE_DAYS = 60;
// Pedidos abiertos que puede tener una persona al mismo tiempo.
export const WANTED_MAX_OPEN_PER_USER = 5;
// "Tengo esta figura" entrega el WhatsApp del comprador: máximo por hora y vendedor.
export const WANTED_CONTACTS_PER_HOUR = 20;

export function wantedActiveSince(now = new Date()): Date {
  return new Date(now.getTime() - WANTED_ACTIVE_DAYS * 24 * 60 * 60 * 1000);
}
