"use client";

import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";
import { formatPrice, getDaysRemaining } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type DiscountControlProps = {
  listingId: string;
  discountAmount: number | null;
  discountExpiresAt?: Date | string | null;
};

export default function DiscountControl({
  listingId,
  discountAmount,
  discountExpiresAt,
}: DiscountControlProps) {
  const daysRemaining = getDaysRemaining(discountExpiresAt);
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(discountAmount ? String(discountAmount) : "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function applyDiscount(amount: number | null) {
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/listings/${listingId}/discount`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ discountAmount: amount }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo aplicar el descuento");
      return;
    }

    setEditing(false);
    router.refresh();
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const amount = Number(value);
    if (!value || Number.isNaN(amount) || amount <= 0) {
      setError("Ingresa un monto de descuento válido");
      return;
    }
    applyDiscount(amount);
  }

  if (!editing) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {discountAmount ? (
          <>
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
              Descuento de {formatPrice(discountAmount)} · vence en {daysRemaining}{" "}
              {daysRemaining === 1 ? "día" : "días"}
            </Badge>
            <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)} className="rounded-full">
              Editar
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => applyDiscount(null)}
              className="rounded-full border-red-200 text-destructive hover:border-red-300 hover:bg-red-50"
            >
              Quitar
            </Button>
          </>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setEditing(true)}
            className="rounded-full border-green-200 text-green-700 hover:bg-green-50"
          >
            Agregar descuento
          </Button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col items-start gap-1 sm:items-end">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="number"
          inputMode="decimal"
          min="0.01"
          step="0.01"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Monto en S/"
          className="w-28 rounded-full"
        />
        <Button type="submit" size="sm" disabled={loading} className="rounded-full">
          {loading ? "..." : "Aplicar"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setEditing(false);
            setError(null);
            setValue(discountAmount ? String(discountAmount) : "");
          }}
          className="text-muted-foreground"
        >
          Cancelar
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">El descuento durará 1 semana desde que lo apliques.</p>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </form>
  );
}
