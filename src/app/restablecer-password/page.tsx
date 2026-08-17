"use client";

import { Suspense, useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

function RestablecerPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo restablecer la contraseña");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <Card className="mt-6 w-full p-6 shadow-sm sm:p-8">
      <h1 className="text-xl font-bold text-foreground">Nueva contraseña</h1>
      <p className="mt-1 text-sm text-muted-foreground">Elige una contraseña nueva para tu cuenta.</p>

      {!token ? (
        <Alert variant="destructive" className="mt-6">
          <AlertDescription>
            Falta el enlace de restablecimiento. Ábrelo desde el correo que te enviamos.
          </AlertDescription>
        </Alert>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password">Contraseña nueva</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={loading} className="w-full rounded-full">
            {loading ? "Guardando..." : "Guardar contraseña"}
          </Button>
        </form>
      )}
    </Card>
  );
}

export default function RestablecerPasswordPage() {
  return (
    <div className="relative isolate overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-orange-50 via-white to-red-50"
      />
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-md flex-col items-center justify-center px-4 py-12">
        <Link href="/" className="flex items-center gap-2 text-2xl font-extrabold">
          <span aria-hidden="true" className="text-3xl">
            🎌
          </span>
          <span className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
            FigurasAnime
          </span>
        </Link>

        <Suspense fallback={null}>
          <RestablecerPasswordForm />
        </Suspense>

        <p className="mt-6 text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-primary hover:underline">
            Volver a iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
