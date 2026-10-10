"use client";

import { useState, FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type StockAlertFormProps = {
  defaultQuery?: string;
  defaultEmail?: string;
  // Sin el campo "¿Qué buscas?" (cuando ya se sabe, ej. desde una búsqueda).
  hideQuery?: boolean;
  submitLabel?: string;
};

export default function StockAlertForm({
  defaultQuery = "",
  defaultEmail = "",
  hideQuery = false,
  submitLabel = "🔔 Avísame",
}: StockAlertFormProps) {
  const [query, setQuery] = useState(defaultQuery);
  const [email, setEmail] = useState(defaultEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ query: string; confirmed: boolean } | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, query }),
    });
    setLoading(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "No se pudo crear el aviso");
      return;
    }
    setDone({ query: data.query, confirmed: !!data.confirmed });
  }

  if (done) {
    return (
      <div className="rounded-lg bg-green-50 dark:bg-green-950/40 p-3 text-sm text-green-900 dark:text-green-300 ring-1 ring-green-200 dark:ring-green-800" role="status">
        {done.confirmed ? (
          <>
            ✅ ¡Listo! Te escribiremos a <strong>{email}</strong> cuando publiquen{" "}
            <strong>{done.query}</strong>.
          </>
        ) : (
          <>
            📩 Revisa tu correo <strong>{email}</strong> y toca <strong>Activar aviso</strong>. Si
            ya lo tenías activo, no tienes que hacer nada.
          </>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {!hideQuery && (
        <div>
          <Label htmlFor="alert-query">¿Qué figura o personaje buscas?</Label>
          <Input
            id="alert-query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ej. Zoro, Goku SH Figuarts, Nendoroid Miku"
            maxLength={80}
            required
            className="mt-1.5"
          />
        </div>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          type="email"
          aria-label="Tu correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
          required
          className="sm:flex-1"
        />
        <Button type="submit" disabled={loading} className="rounded-full">
          {loading ? "Guardando..." : submitLabel}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">
        Sin registrarte. Te escribimos solo cuando llegue, y puedes darte de baja desde el mismo
        correo.
      </p>
    </form>
  );
}
