"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

export default function DeleteUserButton({
  userId,
  userName,
  listingCount,
}: {
  userId: string;
  userName: string;
  listingCount: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canDelete = confirmText.trim() === userName.trim();

  async function handleDelete() {
    if (!canDelete) return;

    setLoading(true);
    setError(null);
    const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    setLoading(false);

    if (res.ok) {
      closeModal();
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo eliminar el usuario");
    }
  }

  function closeModal() {
    setOpen(false);
    setConfirmText("");
    setError(null);
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => (next ? setOpen(true) : closeModal())}>
      <AlertDialogTrigger
        render={<Button variant="outline" size="sm" className="rounded-full border-red-200 dark:border-red-800 text-destructive hover:bg-red-50 dark:hover:bg-red-950/40" />}
      >
        Eliminar
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar usuario</AlertDialogTitle>
          <AlertDialogDescription>
            Esto borra permanentemente la cuenta de{" "}
            <span className="font-semibold text-foreground">{userName}</span>
            {listingCount > 0 && (
              <>
                , {listingCount} {listingCount === 1 ? "figura publicada" : "figuras publicadas"}
              </>
            )}{" "}
            y sus mensajes, favoritos y reseñas.{" "}
            <span className="font-semibold text-destructive">No hay forma de deshacer esto.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="confirm-delete-user">
            Escribe <span className="font-mono font-bold">{userName}</span> para confirmar
          </Label>
          <Input
            id="confirm-delete-user"
            type="text"
            autoFocus
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={!canDelete || loading}
            onClick={handleDelete}
          >
            {loading ? "Eliminando..." : "Eliminar definitivamente"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
