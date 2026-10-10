"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, FormEvent, ChangeEvent, DragEvent } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UploadCloud, X } from "lucide-react";
import {
  prepareImagesForUpload,
  sendFormWithProgress,
  uploadErrorMessage,
} from "@/lib/compressImage";

export default function CommunityPostForm() {
  const router = useRouter();
  const [caption, setCaption] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Publicando...");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function addFiles(fileList: FileList | File[]) {
    const selected = Array.from(fileList).filter((file) => file.type.startsWith("image/"));
    setFiles((prev) => [...prev, ...selected]);
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
    // Las fotos se achican antes de enviarlas (límite de 4.5 MB de Vercel).
    setStatus("Preparando fotos...");
    const uploadFiles = await prepareImagesForUpload(files);
    uploadFiles.forEach((file) => formData.append("images", file));

    let res;
    try {
      res = await sendFormWithProgress("/api/community", "POST", formData, (fraction) =>
        setStatus(fraction >= 1 ? "Guardando..." : `Subiendo fotos... ${Math.round(fraction * 100)} %`)
      );
    } catch {
      setLoading(false);
      setError("No se pudo conectar. Revisa tu conexión e intenta de nuevo.");
      return;
    }

    if (!res.ok) {
      setLoading(false);
      setError(uploadErrorMessage(res.status, res.data.error as string | undefined));
      return;
    }

    // Sigue desactivado hasta que se abra la publicación.
    setStatus("¡Listo! Abriendo...");
    router.push(`/comunidad/${res.data.id as string}`);
  }

  return (
    <Card className="p-6 shadow-sm sm:p-8">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="post-caption">Cuéntanos sobre tu colección</Label>
          <Textarea
            id="post-caption"
            required
            rows={4}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Ej: Mi rincón de Dragon Ball después de 5 años coleccionando..."
          />
        </div>

        <div>
          <Label>Fotos (hasta 10)</Label>
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
            className={`mt-1.5 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border bg-muted/50 hover:border-primary/50 hover:bg-primary/5"
            }`}
          >
            <UploadCloud className="h-9 w-9 text-primary" strokeWidth={1.5} />
            <p className="text-sm font-medium text-foreground">
              Haz clic para subir fotos o arrástralas aquí
            </p>
            <p className="text-xs text-muted-foreground">JPG, PNG, WEBP o GIF · hasta 10 imágenes</p>
          </div>

          {files.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="relative aspect-square overflow-hidden rounded-xl border border-border bg-muted"
                >
                  <Image
                    src={URL.createObjectURL(file)}
                    alt=""
                    fill
                    className="object-contain"
                    unoptimized
                  />
                  <Button
                    type="button"
                    size="icon-xs"
                    variant="destructive"
                    onClick={() => removeFile(index)}
                    className="absolute right-1 top-1 rounded-full bg-black/60 text-white hover:bg-black/80"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={loading} size="lg" className="w-full rounded-full">
          {loading ? status : "Publicar en la comunidad"}
        </Button>
      </form>
    </Card>
  );
}
