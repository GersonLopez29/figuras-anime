"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  type CatalogOrder,
  type CatalogState,
  type ProductLineSlug,
} from "@/lib/catalog";

const ALL_LINES = "todas";

function parseInput(value: string): number | undefined {
  if (value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

export default function CatalogControls({ state }: { state: CatalogState }) {
  const router = useRouter();
  const [min, setMin] = useState(state.min !== undefined ? String(state.min) : "");
  const [max, setMax] = useState(state.max !== undefined ? String(state.max) : "");

  function go(next: CatalogState) {
    router.push(catalogHref(next));
  }

  function handlePriceSubmit(e: FormEvent) {
    e.preventDefault();
    go({ ...state, min: parseInput(min), max: parseInput(max) });
  }

  const hasPrice = state.min !== undefined || state.max !== undefined;

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

      <form onSubmit={handlePriceSubmit} className="flex items-center gap-1.5">
        <span className="text-sm text-muted-foreground">S/</span>
        <Input
          type="number"
          inputMode="numeric"
          min="0"
          placeholder="Mín"
          aria-label="Precio mínimo"
          value={min}
          onChange={(e) => setMin(e.target.value)}
          className="h-9 w-20 rounded-full bg-white px-3"
        />
        <span className="text-sm text-muted-foreground">–</span>
        <Input
          type="number"
          inputMode="numeric"
          min="0"
          placeholder="Máx"
          aria-label="Precio máximo"
          value={max}
          onChange={(e) => setMax(e.target.value)}
          className="h-9 w-20 rounded-full bg-white px-3"
        />
        <Button type="submit" variant="outline" className="h-9 rounded-full px-3">
          Aplicar
        </Button>
        {hasPrice && (
          <Button
            type="button"
            variant="ghost"
            className="h-9 rounded-full px-2 text-muted-foreground"
            onClick={() => {
              setMin("");
              setMax("");
              go({ ...state, min: undefined, max: undefined });
            }}
          >
            Quitar
          </Button>
        )}
      </form>
    </div>
  );
}
