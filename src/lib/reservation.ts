import { z } from "zod";

// "Figura separada": alguien dejó un adelanto, pero la figura sigue a la venta
// y quien pague el total puede comprarla. La separación puede tener fecha
// límite; pasada esa fecha deja de mostrarse sola (sin tareas programadas).

export const MAX_RESERVATION_DAYS = 60;

export function getActiveReservation(
  reservedAmount: number | null | undefined,
  reservedUntil: Date | string | null | undefined,
  now = new Date()
): { amount: number; until: Date | null } | null {
  if (!reservedAmount || reservedAmount <= 0) return null;
  const until = reservedUntil ? new Date(reservedUntil) : null;
  if (until && until.getTime() <= now.getTime()) return null;
  return { amount: reservedAmount, until };
}

// "2026-10-20" (input type="date", hora de Lima) → fin de ese día en Lima.
export function dateInputToEndOfDayLima(value: string): Date {
  return new Date(`${value}T23:59:59.999-05:00`);
}

// Date → "2026-10-20" en hora de Lima, para precargar el input.
export function dateToDateInputLima(date: Date | null | undefined): string {
  if (!date) return "";
  return new Date(date.getTime() - 5 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function formatReservationDate(date: Date): string {
  return date.toLocaleDateString("es-PE", {
    day: "numeric",
    month: "long",
    timeZone: "America/Lima",
  });
}

export const reservationSchema = z.object({
  amount: z.number().positive("Ingresa el monto del adelanto").nullable(),
  until: z
    .string()
    .trim()
    .regex(/^(\d{4}-\d{2}-\d{2})?$/, "Fecha inválida")
    .optional()
    .default(""),
});
