"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWhatsAppContact } from "@/components/WhatsAppContactButton";
import { formatPrice } from "@/lib/format";
import { minOffer, offerError, suggestedOffer } from "@/lib/offers";

type OfferButtonProps = {
  listingId: string;
  // Precio que paga el comprador hoy (con descuento si hay).
  price: number;
};

// "Hacer una oferta": el comprador propone un monto y se abre WhatsApp con la
// oferta escrita para el vendedor. No necesita cuenta.
export default function OfferButton({ listingId, price }: OfferButtonProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(String(suggestedOffer(price)));
  const [touched, setTouched] = useState(false);
  const { open: openWhatsApp, loading, error } = useWhatsAppContact(listingId);
  const value = Number(amount);
  const validation = offerError(value, price);
  const quick = [5, 10, 15]
    .map((pct) => ({ pct, value: Math.floor((price * (1 - pct / 100)) / 5) * 5 }))
    .filter((q) => q.value >= minOffer(price) && q.value < price);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (validation) return;
    await openWhatsApp(value);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="mt-2 w-full rounded-full border-green-300 text-sm font-bold text-green-800 hover:bg-green-50 dark:border-green-800 dark:text-green-300 dark:hover:bg-green-950/40"
          />
        }
      >
        <span aria-hidden="true">🤝</span> Hacer una oferta
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>🤝 Haz tu oferta</DialogTitle>
          <DialogDescription>
            Precio publicado: <strong className="text-foreground">{formatPrice(price)}</strong>. Se
            abrirá WhatsApp con tu oferta escrita para el vendedor; él decide si la acepta.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="offer-amount">Tu oferta (S/)</Label>
            <Input
              id="offer-amount"
              type="number"
              inputMode="decimal"
              min={minOffer(price)}
              max={price}
              step="1"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setTouched(true);
              }}
              className="text-lg font-bold"
              autoFocus
            />
          </div>
          {quick.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {quick.map((q) => (
                <button
                  key={q.pct}
                  type="button"
                  onClick={() => {
                    setAmount(String(q.value));
                    setTouched(true);
                  }}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 transition ${
                    value === q.value
                      ? "bg-green-600 text-white ring-green-600"
                      : "bg-background text-foreground ring-border hover:bg-muted"
                  }`}
                >
                  {formatPrice(q.value)} <span className="opacity-70">(-{q.pct}%)</span>
                </button>
              ))}
            </div>
          )}
          {touched && validation && <p className="text-sm text-destructive">{validation}</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            type="submit"
            disabled={loading || !!validation}
            size="lg"
            className="w-full rounded-full bg-green-600 font-bold text-white hover:bg-green-700"
          >
            {loading ? "Abriendo WhatsApp..." : `💬 Enviar oferta por WhatsApp`}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Una oferta respetuosa tiene más chances: la mínima es {formatPrice(minOffer(price))}.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
