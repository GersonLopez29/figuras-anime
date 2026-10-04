"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ORDER_OPTIONS,
  PRODUCT_LINES,
  catalogHref,
  priceRangeLabel,
  type CatalogOrder,
  type PriceSummary,
  type CatalogState,
  type ProductLineSlug,
} from "@/lib/catalog";

const ALL_LINES = "todas";
const ALL_PRICES = "todos";

function priceKey(min?: number, max?: number): string {
  return min === undefined && max === undefined ? ALL_PRICES : `${min ?? ""}_${max ?? ""}`;
}

function parsePriceKey(key: string): { min?: number; max?: number } {
  if (key === ALL_PRICES) return {};
  const [rawMin, rawMax] = key.split("_");
  return {
    min: rawMin ? Number(rawMin) : undefined,
    max: rawMax ? Number(rawMax) : undefined,
  };
}

export default function CatalogControls({
  state,
  priceSummary,
}: {
  state: CatalogState;
  priceSummary: PriceSummary | null;
}) {
  const router = useRouter();

  function go(next: CatalogState) {
    router.push(catalogHref(next));
  }

  // Rangos calculados por el sistema; si la URL trae otro rango (un enlace
  // antiguo, por ejemplo), se agrega como opción para que siga visible.
  const priceOptions = (priceSummary?.buckets ?? []).map((b) => ({
    key: priceKey(b.min, b.max),
    label: b.label,
  }));
  const currentPriceKey = priceKey(state.min, state.max);
  if (currentPriceKey !== ALL_PRICES && !priceOptions.some((o) => o.key === currentPriceKey)) {
    priceOptions.push({ key: currentPriceKey, label: priceRangeLabel(state.min, state.max) ?? "" });
  }
  const allPricesLabel = priceSummary
    ? priceSummary.lowest === priceSummary.highest
      ? `Todos los precios (S/ ${priceSummary.lowest})`
      : `Todos los precios (S/ ${priceSummary.lowest} – S/ ${priceSummary.highest})`
    : "Todos los precios";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={state.orden ?? "recientes"}
        onValueChange={(v) => v && go({ ...state, orden: v as CatalogOrder })}
      >
        <SelectTrigger aria-label="Ordenar por" className="h-9 rounded-full bg-white px-3">
          <SelectValue>
            {(v: string) => `↕️ ${ORDER_OPTIONS.find((o) => o.value === v)?.label ?? "Ordenar"}`}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {ORDER_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={state.linea ?? ALL_LINES}
        onValueChange={(v) =>
          v && go({ ...state, linea: v === ALL_LINES ? undefined : (v as ProductLineSlug) })
        }
      >
        <SelectTrigger aria-label="Línea o marca" className="h-9 rounded-full bg-white px-3">
          <SelectValue>
            {(v: string) =>
              v === ALL_LINES
                ? "🏷️ Todas las líneas"
                : `🏷️ ${PRODUCT_LINES.find((l) => l.slug === v)?.label ?? v}`
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_LINES}>Todas las líneas</SelectItem>
          {PRODUCT_LINES.map((l) => (
            <SelectItem key={l.slug} value={l.slug}>
              {l.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {priceOptions.length > 0 && (
        <Select
          value={currentPriceKey}
          onValueChange={(v) => v && go({ ...state, min: undefined, max: undefined, ...parsePriceKey(v) })}
        >
          <SelectTrigger aria-label="Rango de precio" className="h-9 rounded-full bg-white px-3">
            <SelectValue>
              {(v: string) =>
                v === ALL_PRICES
                  ? "💰 Todos los precios"
                  : `💰 ${priceOptions.find((o) => o.key === v)?.label ?? "Precio"}`
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false} align="start" className="min-w-64">
            <SelectItem value={ALL_PRICES}>{allPricesLabel}</SelectItem>
            {priceOptions.map((o) => (
              <SelectItem key={o.key} value={o.key}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
