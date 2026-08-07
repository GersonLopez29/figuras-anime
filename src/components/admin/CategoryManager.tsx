"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type CategoryRow = { id: string; name: string; icon: string; listingCount: number };

export default function CategoryManager({ categories }: { categories: CategoryRow[] }) {
  const router = useRouter();

  const [newIcon, setNewIcon] = useState("📦");
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editIcon, setEditIcon] = useState("");
  const [editName, setEditName] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [rowLoading, setRowLoading] = useState<string | null>(null);

  async function handleCreate() {
    if (!newName.trim()) {
      setCreateError("Ponle un nombre a la categoría");
      return;
    }
    setCreateError(null);
    setCreating(true);

    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, icon: newIcon || undefined }),
    });

    setCreating(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setCreateError(data.error ?? "No se pudo crear la categoría");
      return;
    }

    setNewName("");
    setNewIcon("📦");
    router.refresh();
  }

  function startEdit(cat: CategoryRow) {
    setEditingId(cat.id);
    setEditIcon(cat.icon);
    setEditName(cat.name);
    setEditError(null);
  }

  async function handleSaveEdit(id: string) {
    if (!editName.trim()) {
      setEditError("El nombre no puede estar vacío");
      return;
    }
    setEditError(null);
    setRowLoading(id);

    const res = await fetch(`/api/admin/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName, icon: editIcon || undefined }),
    });

    setRowLoading(null);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setEditError(data.error ?? "No se pudo guardar");
      return;
    }

    setEditingId(null);
    router.refresh();
  }

  async function handleDelete(cat: CategoryRow) {
    if (!confirm(`¿Eliminar la categoría "${cat.name}"?`)) return;

    setRowLoading(cat.id);
    const res = await fetch(`/api/admin/categories/${cat.id}`, { method: "DELETE" });
    setRowLoading(null);

    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "No se pudo eliminar la categoría");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end gap-2 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
        <div>
          <label className="block text-xs font-medium text-zinc-600">Ícono</label>
          <input
            type="text"
            value={newIcon}
            onChange={(e) => setNewIcon(e.target.value)}
            maxLength={8}
            className="mt-1 w-16 rounded-md border border-zinc-300 px-2 py-2 text-center text-sm focus:border-orange-500 focus:outline-none"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-zinc-600">Nueva categoría</label>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Ej: Jujutsu Kaisen"
            maxLength={40}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={handleCreate}
          disabled={creating}
          className="rounded-full bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
        >
          {creating ? "Creando..." : "Crear"}
        </button>
      </div>
      {createError && <p className="mt-1.5 text-xs text-red-600">{createError}</p>}

      <div className="mt-4 divide-y divide-zinc-100 rounded-2xl border border-zinc-100 bg-white shadow-sm">
        {categories.map((cat) => {
          const isEditing = editingId === cat.id;
          return (
            <div key={cat.id} className="p-4 transition hover:bg-orange-50/30">
              {isEditing ? (
                <div className="flex flex-wrap items-end gap-2">
                  <input
                    type="text"
                    value={editIcon}
                    onChange={(e) => setEditIcon(e.target.value)}
                    maxLength={8}
                    className="w-16 rounded-md border border-zinc-300 px-2 py-1.5 text-center text-sm focus:border-orange-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    maxLength={40}
                    className="flex-1 rounded-md border border-zinc-300 px-3 py-1.5 text-sm focus:border-orange-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveEdit(cat.id)}
                    disabled={rowLoading === cat.id}
                    className="rounded-full bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
                  >
                    {rowLoading === cat.id ? "Guardando..." : "Guardar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="rounded-full px-3 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-700"
                  >
                    Cancelar
                  </button>
                  {editError && <p className="w-full text-xs text-red-600">{editError}</p>}
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span aria-hidden="true" className="text-lg">
                      {cat.icon}
                    </span>
                    <span className="text-sm font-medium text-zinc-900">{cat.name}</span>
                    <span className="text-xs text-zinc-400">
                      {cat.listingCount} figura{cat.listingCount === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(cat)}
                      className="rounded-full border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-50"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(cat)}
                      disabled={rowLoading === cat.id}
                      className="rounded-full border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:border-red-300 hover:bg-red-50 disabled:opacity-60"
                    >
                      {rowLoading === cat.id ? "Eliminando..." : "Eliminar"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
