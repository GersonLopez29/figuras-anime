"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

// Para una publicación reportada que el admin revisó y deja publicada.
export default function DismissReportsButton({ postId }: { postId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function handleClick() {
    setLoading(true);
    setError(false);
    const res = await fetch(`/api/admin/community/${postId}/reports`, { method: "DELETE" });
    setLoading(false);
    if (res.ok) router.refresh();
    else setError(true);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={loading}
        onClick={handleClick}
        className="rounded-full border-green-300 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-300 dark:hover:bg-green-950/40"
      >
        {loading ? "Guardando..." : "✓ Está bien, quitar reportes"}
      </Button>
      {error && <span className="text-xs text-destructive">No se pudo, intenta de nuevo</span>}
    </div>
  );
}
