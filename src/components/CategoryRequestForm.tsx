"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function CategoryRequestForm() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    if (!name.trim() || !message.trim()) {
      setError("Completa el nombre y el mensaje");
      return;
    }
    setError(null);
    setLoading(true);

    const res = await fetch("/api/category-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, message }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo enviar la solicitud");
      return;
    }

    setDone(true);
  }

  if (done) {
    return (
      <p className="mt-1.5 text-xs font-medium text-muted-foreground">
        ✓ Solicitud enviada, un administrador la revisará.
      </p>
    );
  }

  if (!open) {
    return (
      <Button
        type="button"
        variant="link"
        onClick={() => setOpen(true)}
        className="mt-1.5 h-auto whitespace-normal p-0 text-left text-xs"
      >
        ¿No encuentras tu categoría? Solicítala
      </Button>
    );
  }

  return (
    <div className="mt-2 rounded-lg border border-border bg-muted/50 p-3">
      <div className="space-y-1">
        <Label htmlFor="category-request-name" className="text-xs">
          Nombre de la categoría
        </Label>
        <Input
          id="category-request-name"
          type="text"
          required
          maxLength={40}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Jujutsu Kaisen"
          className="text-xs"
        />
      </div>
      <div className="mt-2 space-y-1">
        <Label htmlFor="category-request-message" className="text-xs">
          Mensaje para el administrador
        </Label>
        <Textarea
          id="category-request-message"
          required
          rows={2}
          maxLength={300}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Cuéntale por qué falta esta categoría"
          className="text-xs"
        />
      </div>
      {error && (
        <Alert variant="destructive" className="mt-1">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="mt-2 flex gap-2">
        <Button type="button" size="sm" onClick={handleSubmit} disabled={loading} className="rounded-full">
          {loading ? "Enviando..." : "Enviar solicitud"}
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
    </div>
  );
}
