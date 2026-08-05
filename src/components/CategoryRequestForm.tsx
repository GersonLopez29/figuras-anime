"use client";

import { useState } from "react";

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
      <p className="mt-1.5 text-xs font-medium text-zinc-500">
        ✓ Solicitud enviada, un administrador la revisará.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-1.5 text-xs font-medium text-orange-600 hover:text-orange-800"
      >
        ¿No encuentras tu categoría? Solicítala
      </button>
    );
  }

  return (
    <div className="mt-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
      <div>
        <label className="block text-xs font-medium text-zinc-600">
          Nombre de la categoría
        </label>
        <input
          type="text"
          required
          maxLength={40}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Jujutsu Kaisen"
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-xs focus:border-orange-500 focus:outline-none"
        />
      </div>
      <div className="mt-2">
        <label className="block text-xs font-medium text-zinc-600">
          Mensaje para el administrador
        </label>
        <textarea
          required
          rows={2}
          maxLength={300}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Cuéntale por qué falta esta categoría"
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-xs focus:border-orange-500 focus:outline-none"
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="rounded-full bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
        >
          {loading ? "Enviando..." : "Enviar solicitud"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full px-3 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-700"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
