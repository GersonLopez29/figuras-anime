"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegistroPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, whatsapp }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo crear la cuenta");
      return;
    }

    router.push(`/?bienvenida=${encodeURIComponent(name)}`);
    router.refresh();
  }

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

        <div className="mt-6 w-full rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-xl font-bold text-zinc-900">Crear cuenta</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Regístrate para publicar y vender tus figuras.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700">Nombre</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700">Correo</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700">Contraseña</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700">
                Número de WhatsApp
              </label>
              <input
                type="tel"
                required
                placeholder="Ej: +51987654321"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100"
              />
              <p className="mt-1 text-xs text-zinc-400">
                Incluye el código de país. Aquí te contactarán los compradores.
              </p>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-orange-600/20 transition hover:-translate-y-0.5 hover:bg-orange-700 hover:shadow-lg disabled:pointer-events-none disabled:opacity-60"
            >
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-sm text-zinc-500">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-medium text-orange-600 hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
