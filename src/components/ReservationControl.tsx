"use client";

import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";
import { formatPrice } from "@/lib/format";
import { dateToDateInputLima, formatReservationDate } from "@/lib/reservation";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type ReservationControlProps = {
  listingId: string;
  // Separación vigente (ya filtrada por fecha) o null.
  reservedAmount: number | null;
  reservedUntil: Date | null;
};

export default function ReservationControl({
  listingId,
  reservedAmount,
  reservedUntil,
}: ReservationControlProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState(reservedAmount ? String(reservedAmount) : "");
  const [until, setUntil] = useState(dateToDateInputLima(reservedUntil));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(next: { amount: number | null; until: string }) {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/listings/${listingId}/reservation`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo guardar");
      return;
    }
    setEditing(false);
    router.refresh();
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const value = Number(amount);
    if (!amount || Number.isNaN(value) || value <= 0) {
      setError("Ingresa el monto del adelanto");
      return;
    }
    save({ amount: value, until });
  }

  if (!editing) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {reservedAmount ? (
          <>
            <Badge className="bg-sky-100 dark:bg-sky-900/40 text-sky-800 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/40">
              🔖 Separada con {formatPrice(reservedAmount)}
              {reservedUntil ? ` · hasta el ${formatReservationDate(reservedUntil)}` : ""}
            </Badge>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
              className="rounded-full"
            >
              Editar
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => save({ amount: null, until: "" })}
              className="rounded-full border-red-200 dark:border-red-800 text-destructive hover:border-red-300 dark:hover:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/40"
            >
              Quitar separación
            </Button>
          </>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setEditing(true)}
            className="rounded-full border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/40"
          >
            🔖 Marcar como separada
          </Button>
        )}
        {error && !editing && <p className="w-full text-xs text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col items-start gap-1.5">
      <div className="flex flex-wrap items-end gap-2">
        <label className="space-y-1">
          <span className="block text-xs text-muted-foreground">Adelanto recibido</span>
          <Input
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Monto en S/"
            className="w-28 rounded-full"
          />
        </label>
        <label className="space-y-1">
          <span className="block text-xs text-muted-foreground">Separada hasta (opcional)</span>
          <Input
            type="date"
            value={until}
            onChange={(e) => setUntil(e.target.value)}
            className="w-40 rounded-full"
          />
        </label>
        <Button type="submit" size="sm" disabled={loading} className="rounded-full">
          {loading ? "..." : "Guardar"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setEditing(false);
            setError(null);
            setAmount(reservedAmount ? String(reservedAmount) : "");
            setUntil(dateToDateInputLima(reservedUntil));
          }}
          className="text-muted-foreground"
        >
          Cancelar
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        La figura sigue visible: los compradores verán que está separada y que pueden comprarla
        pagando el total. Si pones fecha, la separación se quita sola ese día.
      </p>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </form>
  );
}
