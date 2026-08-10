"use client";

import { useState, FormEvent } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ReportPostButton({ postId }: { postId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch(`/api/community/${postId}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo enviar el reporte");
      return;
    }

    setDone(true);
  }

  if (done) {
    return (
      <p className="text-xs font-medium text-muted-foreground">
        ✓ Gracias, un administrador revisará esta publicación.
      </p>
    );
  }

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-auto whitespace-normal rounded-full text-xs font-medium text-muted-foreground hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive"
      >
        🚩 Reportar publicación (ej. foto robada)
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-muted/50 p-3">
      <Label htmlFor="report-reason" className="text-xs">
        ¿Por qué reportas esta publicación?
      </Label>
      <Textarea
        id="report-reason"
        required
        rows={2}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Ej: estas fotos no son de esta persona, las tomó de otra cuenta..."
        className="mt-1 text-xs"
      />
      {error && (
        <Alert variant="destructive" className="mt-1">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="mt-2 flex gap-2">
        <Button type="submit" size="sm" variant="destructive" disabled={loading} className="rounded-full">
          {loading ? "Enviando..." : "Enviar reporte"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setOpen(false)}
          className="rounded-full text-muted-foreground"
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
