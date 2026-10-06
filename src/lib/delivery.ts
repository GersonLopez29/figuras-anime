import { z } from "zod";

// Zonas de entrega que el vendedor marca al publicar. Son zonas amplias (no
// distritos sueltos) para que el filtro del catálogo sea simple de usar y cada
// zona tenga figuras. Los distritos de la descripción ayudan a ubicarse.
export const DELIVERY_ZONES = [
  {
    value: "lima-norte",
    label: "Lima Norte",
    districts: "Comas, Los Olivos, SMP, Independencia, Carabayllo, Puente Piedra",
  },
  {
    value: "lima-centro",
    label: "Lima Centro",
    districts: "Cercado, Breña, La Victoria, Rímac, Galería Lampa",
  },
  {
    value: "lima-moderna",
    label: "Lima Moderna",
    districts: "Miraflores, San Isidro, Surco, San Borja, Jesús María, Lince, San Miguel",
  },
  {
    value: "lima-sur",
    label: "Lima Sur",
    districts: "SJM, VMT, VES, Chorrillos, Mall del Sur",
  },
  {
    value: "lima-este",
    label: "Lima Este",
    districts: "Ate, Santa Anita, SJL, El Agustino, La Molina",
  },
  {
    value: "callao",
    label: "Callao",
    districts: "Callao, Bellavista, La Perla, Ventanilla",
  },
  {
    value: "metro",
    label: "Estaciones del Metro",
    districts: "Línea 1 y Línea 2",
  },
  {
    value: "envio-provincias",
    label: "Envío a provincias",
    districts: "Olva, Shalom u otra agencia",
  },
] as const;

export type DeliveryZone = (typeof DELIVERY_ZONES)[number]["value"];

const ZONE_VALUES = DELIVERY_ZONES.map((z) => z.value) as [DeliveryZone, ...DeliveryZone[]];

export const MAX_DELIVERY_NOTES = 150;

export function isDeliveryZone(value: string | undefined | null): value is DeliveryZone {
  return !!value && (ZONE_VALUES as string[]).includes(value);
}

export function getDeliveryZoneLabel(value: string): string {
  return DELIVERY_ZONES.find((z) => z.value === value)?.label ?? value;
}

// Ordena las zonas como en DELIVERY_ZONES (no en el orden en que se marcaron).
export function sortDeliveryZones(values: string[]): DeliveryZone[] {
  return DELIVERY_ZONES.map((z) => z.value).filter((v) => values.includes(v));
}

// Campos de entrega que reciben POST /api/listings y PATCH /api/listings/[id].
export const deliveryFieldsSchema = z.object({
  deliveryZones: z
    .array(z.enum(ZONE_VALUES))
    .min(1, "Marca al menos una zona de entrega")
    .transform((zones) => [...new Set(zones)]),
  deliveryNotes: z
    .string()
    .trim()
    .max(MAX_DELIVERY_NOTES, `Los puntos de encuentro pueden tener hasta ${MAX_DELIVERY_NOTES} caracteres`)
    .transform((v) => (v === "" ? null : v)),
});

export function readDeliveryFields(formData: FormData) {
  return {
    deliveryZones: formData.getAll("deliveryZones").map(String),
    deliveryNotes: String(formData.get("deliveryNotes") ?? ""),
  };
}
