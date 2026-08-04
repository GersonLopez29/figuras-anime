"use client";

import { useState, FormEvent } from "react";

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
      <p className="text-xs font-medium text-zinc-500">
        ✓ Gracias, un administrador revisará esta publicación.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-zinc-400 hover:text-red-600"
      >
        🚩 Reportar publicación (ej. foto robada)
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
      <label className="block text-xs font-medium text-zinc-600">
        ¿Por qué reportas esta publicación?
      </label>
      <textarea
        required
        rows={2}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Ej: estas fotos no son de esta persona, las tomó de otra cuenta..."
        className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-xs focus:border-red-500 focus:outline-none"
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      <div className="mt-2 flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
        >
          {loading ? "Enviando..." : "Enviar reporte"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full px-3 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-700"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
