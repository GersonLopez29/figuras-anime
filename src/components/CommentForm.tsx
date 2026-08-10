"use client";

import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
    <form onSubmit={handleSubmit}>
      <div className="flex gap-2">
        <Input
          type="text"
          required
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe un comentario..."
          className="rounded-full"
        />
        <Button type="submit" disabled={loading} className="shrink-0 rounded-full">
          {loading ? "..." : "Comentar"}
        </Button>
      </div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </form>
  );
}
