"use client";

import { FormEvent, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ConsignmentForm({ whatsapp }: { whatsapp: string }) {
  const [figure, setFigure] = useState("");
  const [details, setDetails] = useState("");
  const [expectedPrice, setExpectedPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/consignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ figure, details, expectedPrice }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo enviar, intenta de nuevo");
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <Alert className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/40">
        <AlertDescription className="text-green-800 dark:text-green-300">
          ✓ ¡Listo! Recibimos tu solicitud. Te escribiremos al WhatsApp {whatsapp} para coordinar.
          <button
            type="button"
            onClick={() => {
              setSent(false);
              setFigure("");
              setDetails("");
              setExpectedPrice("");
            }}
            className="mt-2 block font-medium text-green-900 dark:text-green-300 underline"
          >
            Enviar otra figura
          </button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="consign-figure">¿Qué figura quieres vender?</Label>
        <Input
          id="consign-figure"
          required
          maxLength={120}
          value={figure}
          onChange={(e) => setFigure(e.target.value)}
          placeholder="Ej: Vegeta Super Saiyan - S.H.Figuarts"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="consign-details">Cuéntanos cómo está</Label>
        <Textarea
          id="consign-details"
          required
          rows={4}
          maxLength={1000}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Estado, si tiene caja y accesorios, si es original, si son varias figuras…"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="consign-price">¿Cuánto esperas recibir? (opcional)</Label>
        <div className="relative max-w-48">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            S/
          </span>
          <Input
            id="consign-price"
            type="number"
            min="0"
            step="0.01"
            value={expectedPrice}
            onChange={(e) => setExpectedPrice(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <p className="text-xs text-muted-foreground">
        Te escribiremos al WhatsApp de tu cuenta ({whatsapp}). Ahí puedes mandarnos las fotos.
      </p>
      <Button type="submit" disabled={loading} className="w-full rounded-full sm:w-auto">
        {loading ? "Enviando..." : "Quiero que la vendan por mí"}
      </Button>
    </form>
  );
}
