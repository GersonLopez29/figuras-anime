"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function OlvidePasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo procesar la solicitud");
      return;
    }

    setSent(true);
  }

  return (
    <div className="relative isolate overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-orange-50 dark:from-orange-950/40 via-white to-red-50 dark:to-red-950/20"
      />
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-md flex-col items-center justify-center px-4 py-12">
        <Link href="/" className="flex items-center gap-2 text-2xl font-extrabold">
          <span aria-hidden="true" className="text-3xl">
            🎌
          </span>
          <span className="bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">
            FigurasAnime
          </span>
        </Link>

        <Card className="mt-6 w-full p-6 shadow-sm sm:p-8">
          <h1 className="text-xl font-bold text-foreground">Recuperar contraseña</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ingresa tu correo y te enviaremos un enlace para restablecerla.
          </p>

          {sent ? (
            <Alert className="mt-6">
              <AlertDescription>
                Si ese correo tiene una cuenta registrada, te enviamos un enlace para restablecer tu
                contraseña. Revisa tu bandeja de entrada (y spam).
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Correo</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" disabled={loading} className="w-full rounded-full">
                {loading ? "Enviando..." : "Enviar enlace"}
              </Button>
            </form>
          )}
        </Card>

        <p className="mt-6 text-sm text-muted-foreground">
          ¿Ya la recordaste?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
