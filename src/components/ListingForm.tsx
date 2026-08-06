"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, FormEvent, ChangeEvent, DragEvent } from "react";
import Image from "next/image";
import CategoryRequestForm from "@/components/CategoryRequestForm";
import { CONDITION_OPTIONS, USED_CONDITION_OPTIONS, isNewCondition } from "@/lib/condition";

type ExistingImage = { id: string; url: string };
type CategoryOption = { name: string; icon: string };

type ListingFormProps =
  | {
      mode: "create";
      categories: CategoryOption[];
    }
  | {
      mode: "edit";
      listingId: string;
      initialTitle: string;
      initialDescription: string;
      initialPrice: number;
      initialCategory: string;
      initialCondition: string;
      initialImages: ExistingImage[];
      categories: CategoryOption[];
    };

export default function ListingForm(props: ListingFormProps) {
  const router = useRouter();
  const isEdit = props.mode === "edit";

  const [title, setTitle] = useState(isEdit ? props.initialTitle : "");
  const [description, setDescription] = useState(isEdit ? props.initialDescription : "");
  const [price, setPrice] = useState(isEdit ? String(props.initialPrice) : "");
  const [category, setCategory] = useState(
    isEdit ? props.initialCategory : (props.categories[0]?.name ?? "")
  );
  const [condition, setCondition] = useState(
    isEdit ? props.initialCondition : CONDITION_OPTIONS[0].value
  );
  const [existingImages, setExistingImages] = useState<ExistingImage[]>(
    isEdit ? props.initialImages : []
  );
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function addFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList).filter((file) => file.type.startsWith("image/"));
    setNewFiles((prev) => [...prev, ...files]);
  }

  function handleFilesSelected(e: ChangeEvent<HTMLInputElement>) {
    addFiles(e.target.files ?? []);
    e.target.value = "";
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  }

  function removeNewFile(index: number) {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function removeExistingImage(id: string) {
    setExistingImages((prev) => prev.filter((img) => img.id !== id));
    setRemovedImageIds((prev) => [...prev, id]);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const totalImages = existingImages.length + newFiles.length;
    if (totalImages === 0) {
      setError("Sube al menos una imagen de la figura");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.set("title", title);
    formData.set("description", description);
    formData.set("price", price);
    formData.set("category", category);
    formData.set("condition", condition);
    newFiles.forEach((file) => formData.append("images", file));
    if (isEdit) {
      removedImageIds.forEach((id) => formData.append("removeImageIds", id));
    }

    const url = isEdit ? `/api/listings/${props.listingId}` : "/api/listings";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, { method, body: formData });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Ocurrió un error, intenta de nuevo");
      return;
    }

    const listing = await res.json();
    router.push(`/figura/${listing.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-zinc-700">Título</label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej: Figura de Goku Ultra Instinto 25cm"
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">Descripción</label>
        <textarea
          required
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Estado, material, tamaño, si tiene caja original, etc."
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700">Precio (S/)</label>
          <div className="relative mt-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">
              S/
            </span>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-md border border-zinc-300 py-2 pl-9 pr-3 text-sm focus:border-orange-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">Categoría</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
          >
            {props.categories.map((cat) => (
              <option key={cat.name} value={cat.name}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
          <CategoryRequestForm />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">Estado</label>
        <div className="mt-1 flex gap-2">
          <button
            type="button"
            onClick={() => setCondition("nuevo")}
            className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium ${
              isNewCondition(condition)
                ? "border-orange-500 bg-orange-50 text-orange-700"
                : "border-zinc-300 text-zinc-600 hover:border-orange-300"
            }`}
          >
            🆕 Nueva
          </button>
          <button
            type="button"
            onClick={() => setCondition(USED_CONDITION_OPTIONS[0].value)}
            className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium ${
              !isNewCondition(condition)
                ? "border-orange-500 bg-orange-50 text-orange-700"
                : "border-zinc-300 text-zinc-600 hover:border-orange-300"
            }`}
          >
            ♻️ Usada
          </button>
        </div>

        {!isNewCondition(condition) && (
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
          >
            {USED_CONDITION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">
          Imágenes (hasta 6)
        </label>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg, image/webp, image/gif"
          multiple
          onChange={handleFilesSelected}
          className="hidden"
        />

        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`mt-1 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors ${
            isDragging
              ? "border-orange-500 bg-orange-50"
              : "border-zinc-300 bg-zinc-50 hover:border-orange-400 hover:bg-orange-50"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className="h-9 w-9 text-orange-500"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 8.25 12 3.75m0 0L7.5 8.25M12 3.75v13.5"
            />
          </svg>
          <p className="text-sm font-medium text-zinc-700">
            Haz clic para subir fotos o arrástralas aquí
          </p>
          <p className="text-xs text-zinc-500">JPG, PNG, WEBP o GIF · hasta 6 imágenes</p>
        </div>

        {(existingImages.length > 0 || newFiles.length > 0) && (
          <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {existingImages.map((img) => (
              <div key={img.id} className="relative aspect-square overflow-hidden rounded-md border border-zinc-200">
                <Image src={img.url} alt="" fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => removeExistingImage(img.id)}
                  className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 py-0.5 text-xs text-white"
                >
                  ✕
                </button>
              </div>
            ))}
            {newFiles.map((file, index) => (
              <div key={index} className="relative aspect-square overflow-hidden rounded-md border border-zinc-200">
                <Image
                  src={URL.createObjectURL(file)}
                  alt=""
                  fill
                  className="object-cover"
                  unoptimized
                />
                <button
                  type="button"
                  onClick={() => removeNewFile(index)}
                  className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 py-0.5 text-xs text-white"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
      >
        {loading ? "Guardando..." : isEdit ? "Guardar cambios" : "Publicar figura"}
      </button>
    </form>
  );
}
