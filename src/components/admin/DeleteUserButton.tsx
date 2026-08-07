"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
      setOpen(false);
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
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-red-600 hover:text-red-800"
      >
        Eliminar
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-lg bg-white p-5 shadow-xl">
            <h3 className="text-base font-bold text-zinc-900">Eliminar usuario</h3>
            <p className="mt-2 text-sm text-zinc-600">
              Esto borra permanentemente la cuenta de{" "}
              <span className="font-semibold text-zinc-900">{userName}</span>
              {listingCount > 0 && (
                <>
                  , {listingCount} {listingCount === 1 ? "figura publicada" : "figuras publicadas"}
                </>
              )}{" "}
              y sus mensajes, favoritos y reseñas.{" "}
              <span className="font-semibold text-red-600">
                No hay forma de deshacer esto.
              </span>
            </p>

            <label className="mt-4 block text-sm font-medium text-zinc-700">
              Escribe <span className="font-mono font-bold">{userName}</span> para confirmar
            </label>
            <input
              type="text"
              autoFocus
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
            />

            {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!canDelete || loading}
                onClick={handleDelete}
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? "Eliminando..." : "Eliminar definitivamente"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
