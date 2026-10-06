"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CategoryOption = { name: string; icon: string };

const ANY_CATEGORY = "__any";

export default function WantedPostForm({ categories }: { categories: CategoryOption[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [category, setCategory] = useState(ANY_CATEGORY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/wanted", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        details,
        maxPrice,
        category: category === ANY_CATEGORY ? "" : category,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo publicar");
      return;
    }
    setTitle("");
    setDetails("");
    setMaxPrice("");
    setCategory(ANY_CATEGORY);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="wanted-title">¿Qué figura buscas?</Label>
        <Input
          id="wanted-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej. Zoro Wano SH Figuarts"
          maxLength={80}
          required
          className="mt-1.5"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="wanted-price">Presupuesto máximo (opcional)</Label>
          <div className="relative mt-1.5">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
              S/
            </span>
            <Input
              id="wanted-price"
              type="number"
              inputMode="decimal"
              min="1"
              step="1"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <div>
          <Label>Categoría (opcional)</Label>
          <Select value={category} onValueChange={(v) => v && setCategory(v)}>
            <SelectTrigger className="mt-1.5 w-full">
              <SelectValue>
                {(v: string) => {
                  if (v === ANY_CATEGORY) return "Cualquiera";
                  const cat = categories.find((c) => c.name === v);
                  return cat ? `${cat.icon} ${cat.name}` : v;
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY_CATEGORY}>Cualquiera</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.name} value={cat.name}>
                  {cat.icon} {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="wanted-details">Detalles (opcional)</Label>
        <Textarea
          id="wanted-details"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Versión, estado que aceptas (nueva, usada, sin caja), zona de entrega…"
          maxLength={500}
          rows={3}
          className="mt-1.5"
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading} className="rounded-full">
        {loading ? "Publicando..." : "🔎 Publicar lo que busco"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Los vendedores registrados te escribirán a tu WhatsApp. Además te avisamos por correo si
        alguien publica una figura que coincida. El pedido se muestra 60 días.
      </p>
    </form>
  );
}
