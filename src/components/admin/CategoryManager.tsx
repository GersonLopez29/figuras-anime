"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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

type CategoryRow = { id: string; name: string; icon: string; listingCount: number };

function DeleteCategoryButton({
  category,
  onDelete,
}: {
  category: CategoryRow;
  onDelete: (id: string) => Promise<string | null>;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setLoading(true);
    const errorMessage = await onDelete(category.id);
    setLoading(false);

    if (errorMessage) {
      setError(errorMessage);
    } else {
      setOpen(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => { setOpen(next); if (next) setError(null); }}>
      <AlertDialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="rounded-full border-red-200 text-destructive hover:bg-red-50"
          />
        }
      >
        Eliminar
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar la categoría &quot;{category.name}&quot;?</AlertDialogTitle>
          <AlertDialogDescription>
            {category.listingCount > 0
              ? `Hay ${category.listingCount} figura${category.listingCount === 1 ? "" : "s"} usando esta categoría.`
              : "Esta acción no se puede deshacer."}
            {error && <span className="mt-1 block font-medium text-destructive">{error}</span>}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={loading} onClick={handleConfirm}>
            {loading ? "Eliminando..." : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

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

  async function handleDelete(id: string): Promise<string | null> {
    setRowLoading(id);
    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    setRowLoading(null);

    if (res.ok) {
      router.refresh();
      return null;
    }
    const data = await res.json().catch(() => ({}));
    return data.error ?? "No se pudo eliminar la categoría";
  }

  return (
    <div>
      <Card className="flex-row flex-wrap items-end gap-2 p-4 shadow-sm">
        <div className="space-y-1">
          <Label htmlFor="new-cat-icon" className="text-xs">Ícono</Label>
          <Input
            id="new-cat-icon"
            type="text"
            value={newIcon}
            onChange={(e) => setNewIcon(e.target.value)}
            maxLength={8}
            className="w-16 text-center"
          />
        </div>
        <div className="flex-1 space-y-1">
          <Label htmlFor="new-cat-name" className="text-xs">Nueva categoría</Label>
          <Input
            id="new-cat-name"
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Ej: Jujutsu Kaisen"
            maxLength={40}
          />
        </div>
        <Button type="button" onClick={handleCreate} disabled={creating} className="rounded-full">
          {creating ? "Creando..." : "Crear"}
        </Button>
      </Card>
      {createError && <p className="mt-1.5 text-xs text-destructive">{createError}</p>}

      <Card className="mt-4 gap-0 divide-y divide-border py-0 shadow-sm">
        {categories.map((cat) => {
          const isEditing = editingId === cat.id;
          return (
            <div key={cat.id} className="p-4 transition hover:bg-primary/5">
              {isEditing ? (
                <div className="flex flex-wrap items-end gap-2">
                  <Input
                    type="text"
                    value={editIcon}
                    onChange={(e) => setEditIcon(e.target.value)}
                    maxLength={8}
                    className="w-16 text-center"
                  />
                  <Input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    maxLength={40}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleSaveEdit(cat.id)}
                    disabled={rowLoading === cat.id}
                    className="rounded-full"
                  >
                    {rowLoading === cat.id ? "Guardando..." : "Guardar"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingId(null)}
                    className="rounded-full text-muted-foreground"
                  >
                    Cancelar
                  </Button>
                  {editError && <p className="w-full text-xs text-destructive">{editError}</p>}
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span aria-hidden="true" className="text-lg">
                      {cat.icon}
                    </span>
                    <span className="text-sm font-medium text-foreground">{cat.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {cat.listingCount} figura{cat.listingCount === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => startEdit(cat)}
                      className="rounded-full"
                    >
                      Editar
                    </Button>
                    <DeleteCategoryButton category={cat} onDelete={handleDelete} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </Card>
    </div>
  );
}
