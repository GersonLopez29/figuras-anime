"use client";

import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";

export default function CommentForm({ postId }: { postId: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch(`/api/community/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo publicar el comentario");
      return;
    }

    setText("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        required
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Escribe un comentario..."
        className="w-full rounded-full border border-zinc-300 px-4 py-2 text-sm focus:border-orange-500 focus:outline-none"
      />
      <button
        type="submit"
        disabled={loading}
        className="shrink-0 rounded-full bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
      >
        {loading ? "..." : "Comentar"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  );
}
