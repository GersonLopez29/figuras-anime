"use client";

import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";
import { formatPrice } from "@/lib/format";

type DiscountControlProps = {
  listingId: string;
  discountAmount: number | null;
};

export default function DiscountControl({ listingId, discountAmount }: DiscountControlProps) {
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
      <div className="flex items-center gap-2">
        {discountAmount ? (
          <>
            <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
              Descuento de {formatPrice(discountAmount)}
            </span>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
            >
              Editar
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => applyDiscount(null)}
              className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-60"
            >
              Quitar
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-sm font-medium text-green-700 hover:text-green-900"
          >
            Agregar descuento
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          min="0.01"
          step="0.01"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Monto en S/"
          className="w-28 rounded-full border border-zinc-300 px-3 py-1 text-sm focus:border-orange-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-orange-600 px-3 py-1 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
        >
          {loading ? "..." : "Aplicar"}
        </button>
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setError(null);
            setValue(discountAmount ? String(discountAmount) : "");
          }}
          className="text-sm font-medium text-zinc-500 hover:text-zinc-800"
        >
          Cancelar
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  );
}
