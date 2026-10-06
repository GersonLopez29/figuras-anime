"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type WantedPostActionsProps = {
  postId: string;
  // El dueño de un pedido abierto puede marcarlo como conseguido; el admin
  // (y el dueño de un pedido cerrado) solo puede borrarlo.
  canMarkFound?: boolean;
};

export default function WantedPostActions({ postId, canMarkFound = false }: WantedPostActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function markFound() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/wanted/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "found" }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("No se pudo actualizar");
      return;
    }
    router.refresh();
  }

  async function handleDelete() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/wanted/${postId}`, { method: "DELETE" });
    setLoading(false);
    if (!res.ok) {
      setError("No se pudo borrar");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canMarkFound && (
        <Button type="button" size="sm" onClick={markFound} disabled={loading} className="rounded-full">
          ✅ Ya la conseguí
        </Button>
      )}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger
          render={<Button type="button" size="sm" variant="outline" className="rounded-full text-destructive" />}
        >
          Borrar
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Borrar este pedido?</AlertDialogTitle>
            <AlertDialogDescription>
              Dejará de verse en &quot;Se busca&quot; y no llegarán más avisos por él.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {open && error && <p className="text-sm text-destructive">{error}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={loading} variant="destructive">
              {loading ? "Borrando..." : "Borrar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {!open && error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
