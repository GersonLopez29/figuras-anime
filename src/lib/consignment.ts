import { z } from "zod";

// "Te la vendemos": el coleccionista entrega su figura y la tienda la vende.
// La comisión se muestra en la página pública; cámbiala aquí si cambia la tarifa.
export const CONSIGNMENT_COMMISSION_PERCENT = 15;

// Máximo de solicitudes por usuario en 24 horas (evita spam).
export const CONSIGNMENT_DAILY_LIMIT = 5;

export const CONSIGNMENT_STATUSES = [
  { value: "nuevo", label: "Nueva", className: "bg-blue-100 text-blue-800" },
  { value: "contactado", label: "Contactado", className: "bg-amber-100 text-amber-800" },
  { value: "aceptado", label: "Aceptada (en venta)", className: "bg-violet-100 text-violet-800" },
  { value: "vendido", label: "Vendida", className: "bg-green-100 text-green-800" },
  { value: "rechazado", label: "Rechazada", className: "bg-zinc-200 text-zinc-700" },
] as const;

export type ConsignmentStatus = (typeof CONSIGNMENT_STATUSES)[number]["value"];

const STATUS_VALUES = CONSIGNMENT_STATUSES.map((s) => s.value) as [
  ConsignmentStatus,
  ...ConsignmentStatus[],
];

export function getConsignmentStatus(value: string) {
  return CONSIGNMENT_STATUSES.find((s) => s.value === value) ?? CONSIGNMENT_STATUSES[0];
}

export const consignmentStatusSchema = z.object({ status: z.enum(STATUS_VALUES) });

export const consignmentRequestSchema = z.object({
  figure: z
    .string()
    .trim()
    .min(3, "Cuéntanos qué figura es")
    .max(120, "El nombre de la figura es muy largo"),
  details: z
    .string()
    .trim()
    .min(10, "Cuéntanos un poco más: estado, si tiene caja, accesorios…")
    .max(1000, "La descripción puede tener hasta 1000 caracteres"),
  expectedPrice: z
    .union([z.literal(""), z.coerce.number().positive("El precio debe ser mayor a 0").max(100000)])
    .transform((v) => (v === "" ? null : v)),
});
