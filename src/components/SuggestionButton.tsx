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

export default function SuggestionButton() {
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
  }

  return (
    <Dialog onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button className="fixed bottom-5 right-5 z-40 h-11 gap-1.5 rounded-full px-4 shadow-lg shadow-orange-600/20" />
        }
      >
        <Lightbulb className="size-4" />
        Sugerencias
      </DialogTrigger>

      <DialogContent showCloseButton={!loading}>
        <DialogHeader>
          <DialogTitle>¿Tienes una idea?</DialogTitle>
          <DialogDescription>
            Cuéntanos qué te gustaría ver en FigurasAnime. Tu mensaje nos llega directo por correo.
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
