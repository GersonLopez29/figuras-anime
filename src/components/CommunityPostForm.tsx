"use client";

import { useRouter } from "next/navigation";
import { useState, FormEvent, ChangeEvent } from "react";
import Image from "next/image";

export default function CommunityPostForm() {
  const router = useRouter();
  const [caption, setCaption] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleFilesSelected(e: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    setFiles((prev) => [...prev, ...selected]);
    e.target.value = "";
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (files.length === 0) {
      setError("Sube al menos una foto de tu colección");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.set("caption", caption);
    files.forEach((file) => formData.append("images", file));

    const res = await fetch("/api/community", { method: "POST", body: formData });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Ocurrió un error, intenta de nuevo");
      return;
    }

    const post = await res.json();
    router.push(`/comunidad/${post.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-zinc-700">
          Cuéntanos sobre tu colección
        </label>
        <textarea
          required
          rows={4}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Ej: Mi rincón de Dragon Ball después de 5 años coleccionando..."
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">
          Fotos (hasta 10)
        </label>
        <input
          type="file"
          accept="image/png, image/jpeg, image/webp, image/gif"
          multiple
          onChange={handleFilesSelected}
          className="mt-1 w-full text-sm text-zinc-600"
        />

        {files.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {files.map((file, index) => (
              <div
                key={index}
                className="relative aspect-square overflow-hidden rounded-md border border-zinc-200"
              >
                <Image
                  src={URL.createObjectURL(file)}
                  alt=""
                  fill
                  className="object-cover"
                  unoptimized
                />
                <button
                  type="button"
                  onClick={() => removeFile(index)}
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
        {loading ? "Publicando..." : "Publicar en la comunidad"}
      </button>
    </form>
  );
}
