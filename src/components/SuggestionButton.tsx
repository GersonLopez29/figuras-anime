"use client";

import { useState, FormEvent } from "react";
import { Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Botón flotante "Sugerencias" (cuando el asistente no está activo).
export default function SuggestionButton() {
  return (
    <SuggestionDialog
      trigger={
        <Button
          aria-label="Enviar una sugerencia"
          className="suggestion-fab fixed bottom-4 right-4 z-40 size-11 gap-1.5 rounded-full p-0 opacity-90 shadow-lg shadow-orange-600/20 transition-opacity hover:opacity-100 sm:bottom-5 sm:right-5 sm:h-11 sm:w-auto sm:px-4"
        />
      }
      triggerContent={
        <>
          <Lightbulb className="size-4" />
          <span className="hidden sm:inline">Sugerencias</span>
        </>
      }
    />
  );
}

// El formulario de sugerencias. Con trigger se abre con ese botón; sin trigger
// se controla desde afuera con open/onOpenChange (lo usa el chat del asistente).
export function SuggestionDialog({
  trigger,
  triggerContent,
  open,
  onOpenChange,
}: {
  trigger?: React.ReactElement;
  triggerContent?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/sugerencias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, name, email }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo enviar tu sugerencia");
      return;
    }

    setSent(true);
    setMessage("");
    setName("");
    setEmail("");
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setError(null);
      setSent(false);
    }
    onOpenChange?.(nextOpen);
  }

  return (
    <Dialog {...(open !== undefined ? { open } : {})} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger render={trigger}>{triggerContent}</DialogTrigger>}

      <DialogContent showCloseButton={!loading}>
        <DialogHeader>
          <DialogTitle>¿Tienes una idea?</DialogTitle>
          <DialogDescription>
            Cuéntanos qué te gustaría ver en GerStore. Tu mensaje nos llega directo por correo.
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="py-2">
            <Alert>
              <AlertDescription>
                ¡Gracias! Ya recibimos tu sugerencia.
              </AlertDescription>
            </Alert>
            <DialogClose render={<Button className="mt-4 w-full rounded-full" />}>
              Cerrar
            </DialogClose>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="suggestion-message">Tu sugerencia</Label>
              <Textarea
                id="suggestion-message"
                required
                minLength={5}
                maxLength={1000}
                rows={4}
                placeholder="Ej: Me gustaría poder filtrar por precio..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="suggestion-name">Nombre (opcional)</Label>
              <Input
                id="suggestion-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="suggestion-email">Correo (opcional, por si queremos responderte)</Label>
              <Input
                id="suggestion-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button type="submit" disabled={loading} className="w-full rounded-full sm:w-auto">
                {loading ? "Enviando..." : "Enviar sugerencia"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
