"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, FormEvent, ChangeEvent, DragEvent } from "react";
import Image from "next/image";
import CategoryRequestForm from "@/components/CategoryRequestForm";
import { suggestCategory } from "@/lib/categorySuggest";
import { listingPath } from "@/lib/slug";
import { DELIVERY_ZONES, MAX_DELIVERY_NOTES } from "@/lib/delivery";
import {
  CONDITION_OPTIONS,
  USED_CONDITION_OPTIONS,
  isNewCondition,
  isOpenBoxCondition,
} from "@/lib/condition";
import { PHOTO_TYPE_HELP, type PhotoType } from "@/lib/photoType";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UploadCloud, X } from "lucide-react";

type ExistingImage = { id: string; url: string };
type CategoryOption = { name: string; icon: string };

type ListingFormProps =
  | {
      mode: "create";
      categories: CategoryOption[];
      // Zonas de la última publicación del vendedor, para no marcarlas cada vez.
      defaultDeliveryZones?: string[];
      defaultDeliveryNotes?: string | null;
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
      initialDeliveryZones: string[];
      initialDeliveryNotes: string | null;
      initialIsPreorder: boolean;
      // "2026-12" (mes estimado de llegada) o "".
      initialPreorderArrival: string;
      initialPreorderDeposit: number | null;
      initialPhotoType: string | null;
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
  const [deliveryZones, setDeliveryZones] = useState<string[]>(
    isEdit ? props.initialDeliveryZones : (props.defaultDeliveryZones ?? [])
  );
  const [deliveryNotes, setDeliveryNotes] = useState(
    (isEdit ? props.initialDeliveryNotes : props.defaultDeliveryNotes) ?? ""
  );
  const [photoType, setPhotoType] = useState<PhotoType | "">(
    isEdit && (props.initialPhotoType === "real" || props.initialPhotoType === "referencial")
      ? props.initialPhotoType
      : ""
  );
  const [isPreorder, setIsPreorder] = useState(isEdit ? props.initialIsPreorder : false);
  const [preorderArrival, setPreorderArrival] = useState(
    isEdit ? props.initialPreorderArrival : ""
  );
  const [preorderDeposit, setPreorderDeposit] = useState(
    isEdit && props.initialPreorderDeposit !== null ? String(props.initialPreorderDeposit) : ""
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

  const suggestedCategory = suggestCategory(
    title,
    props.categories.map((c) => c.name)
  );
  const showCategorySuggestion = !!suggestedCategory && suggestedCategory !== category;

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

  function toggleZone(zone: string) {
    setDeliveryZones((prev) =>
      prev.includes(zone) ? prev.filter((z) => z !== zone) : [...prev, zone]
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (deliveryZones.length === 0) {
      setError("Marca al menos una zona de entrega");
      return;
    }
    if (isPreorder && !preorderArrival) {
      setError("Indica el mes estimado de llegada de la preventa");
      return;
    }

    const totalImages = existingImages.length + newFiles.length;
    if (totalImages === 0) {
      setError("Sube al menos una imagen de la figura");
      return;
    }
    if (!photoType) {
      setError("Indica si las fotos son reales o referenciales");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.set("title", title);
    formData.set("description", description);
    formData.set("price", price);
    formData.set("category", category);
    formData.set("condition", condition);
    formData.set("photoType", photoType);
    deliveryZones.forEach((zone) => formData.append("deliveryZones", zone));
    formData.set("deliveryNotes", deliveryNotes);
    formData.set("isPreorder", String(isPreorder));
    formData.set("preorderArrival", isPreorder ? preorderArrival : "");
    formData.set("preorderDeposit", isPreorder ? preorderDeposit : "");
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
    router.push(listingPath(listing));
    router.refresh();
  }

  return (
    <Card className="p-6 shadow-sm sm:p-8">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="listing-title">Título</Label>
          <Input
            id="listing-title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Goku Super Saiyan - S.H.Figuarts - Bandai - Sellado"
            aria-describedby="listing-title-help"
          />
          <p id="listing-title-help" className="text-xs text-muted-foreground">
            Incluye el personaje, la línea o marca (S.H.Figuarts, Ichiban Kuji, Funko…) y si viene
            sellada. Así te encuentran más rápido en el buscador.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="listing-description">Descripción</Label>
          <Textarea
            id="listing-description"
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Estado, material, tamaño, si tiene caja original, etc."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="listing-price">Precio (S/)</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                S/
              </span>
              <Input
                id="listing-price"
                type="number"
                required
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Categoría</Label>
            <Select value={category} onValueChange={(v) => v && setCategory(v)}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(v: string) => {
                    const cat = props.categories.find((c) => c.name === v);
                    return cat ? `${cat.icon} ${cat.name}` : v;
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {props.categories.map((cat) => (
                  <SelectItem key={cat.name} value={cat.name}>
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {showCategorySuggestion && (
              <button
                type="button"
                onClick={() => setCategory(suggestedCategory)}
                className="block text-left text-xs font-medium text-primary hover:underline"
              >
                ¿Es de {suggestedCategory}? Usar esa categoría
              </button>
            )}
            <CategoryRequestForm />
          </div>
        </div>

        <div>
          <Label>Estado</Label>
          <div className="mt-1.5 flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCondition("nuevo")}
              className={`flex-1 ${
                isNewCondition(condition) ? "border-primary bg-primary/5 text-primary" : "text-muted-foreground"
              }`}
            >
              🆕 Nueva
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCondition("open_box")}
              className={`flex-1 ${
                isOpenBoxCondition(condition) ? "border-primary bg-primary/5 text-primary" : "text-muted-foreground"
              }`}
            >
              📦 Open box
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCondition(USED_CONDITION_OPTIONS[0].value)}
              className={`flex-1 ${
                !isNewCondition(condition) && !isOpenBoxCondition(condition)
                  ? "border-primary bg-primary/5 text-primary"
                  : "text-muted-foreground"
              }`}
            >
              ♻️ Usada
            </Button>
          </div>

          {isOpenBoxCondition(condition) && (
            <p className="mt-2 text-xs text-muted-foreground">
              La caja se abrió solo para revisarla: la figura no se posó ni se articuló.
            </p>
          )}

          {!isNewCondition(condition) && !isOpenBoxCondition(condition) && (
            <Select value={condition} onValueChange={(v) => v && setCondition(v)}>
              <SelectTrigger className="mt-2 w-full">
                <SelectValue>
                  {(v: string) => USED_CONDITION_OPTIONS.find((opt) => opt.value === v)?.label ?? v}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {USED_CONDITION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div
          className={`rounded-lg border p-3 transition ${
            isPreorder ? "border-violet-300 dark:border-violet-800 bg-violet-50/60 dark:bg-violet-950/40" : "border-input"
          }`}
        >
          <label className="flex cursor-pointer items-start gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={isPreorder}
              onChange={(e) => setIsPreorder(e.target.checked)}
              className="mt-0.5 size-4 accent-violet-600"
            />
            <span>
              <span className="block font-medium text-foreground">🕒 Es una preventa</span>
              <span className="block text-xs text-muted-foreground">
                La figura todavía no llega: el comprador la separa ahora y la recibe cuando llegue.
              </span>
            </span>
          </label>
          {isPreorder && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="listing-preorder-arrival">Llega aprox. en</Label>
                <Input
                  id="listing-preorder-arrival"
                  type="month"
                  required
                  value={preorderArrival}
                  onChange={(e) => setPreorderArrival(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="listing-preorder-deposit">Adelanto (opcional)</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    S/
                  </span>
                  <Input
                    id="listing-preorder-deposit"
                    type="number"
                    min="0"
                    step="0.01"
                    value={preorderDeposit}
                    onChange={(e) => setPreorderDeposit(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <fieldset className="space-y-1.5">
          <legend className="text-sm font-medium leading-none">📍 ¿Dónde entregas?</legend>
          <p className="text-xs text-muted-foreground">
            Marca todas las zonas donde puedes entregar. Los compradores filtran por zona.
          </p>
          <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2">
            {DELIVERY_ZONES.map((zone) => {
              const checked = deliveryZones.includes(zone.value);
              return (
                <label
                  key={zone.value}
                  className={`flex cursor-pointer items-start gap-2.5 rounded-lg border p-2.5 text-sm transition ${
                    checked
                      ? "border-primary bg-primary/5"
                      : "border-input hover:border-primary/40"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleZone(zone.value)}
                    className="mt-0.5 size-4 accent-orange-600"
                  />
                  <span>
                    <span className="block font-medium text-foreground">{zone.label}</span>
                    <span className="block text-xs text-muted-foreground">{zone.districts}</span>
                  </span>
                </label>
              );
            })}
          </div>
          <div className="space-y-1.5 pt-2">
            <Label htmlFor="listing-delivery-notes">Puntos de encuentro (opcional)</Label>
            <Input
              id="listing-delivery-notes"
              type="text"
              maxLength={MAX_DELIVERY_NOTES}
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              placeholder="Ej: Mall del Sur, estación Angamos, Galería Lampa"
            />
          </div>
        </fieldset>

        <div>
          <Label>Imágenes (hasta 6)</Label>

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
            <p className="text-xs text-muted-foreground">JPG, PNG, WEBP o GIF · hasta 6 imágenes</p>
          </div>

          {(existingImages.length > 0 || newFiles.length > 0) && (
            <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {existingImages.map((img) => (
                <div key={img.id} className="relative aspect-square overflow-hidden rounded-xl border border-border">
                  <Image src={img.url} alt="" fill className="object-cover" />
                  <Button
                    type="button"
                    size="icon-xs"
                    variant="destructive"
                    onClick={() => removeExistingImage(img.id)}
                    className="absolute right-1 top-1 rounded-full bg-black/60 text-white hover:bg-black/80"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {newFiles.map((file, index) => (
                <div key={index} className="relative aspect-square overflow-hidden rounded-xl border border-border">
                  <Image
                    src={URL.createObjectURL(file)}
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <Button
                    type="button"
                    size="icon-xs"
                    variant="destructive"
                    onClick={() => removeNewFile(index)}
                    className="absolute right-1 top-1 rounded-full bg-black/60 text-white hover:bg-black/80"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <p className="mt-4 text-sm font-medium text-foreground">¿Las fotos son de tu figura?</p>
          <div className="mt-1.5 flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPhotoType("real")}
              aria-pressed={photoType === "real"}
              className={`h-auto flex-1 whitespace-normal py-2 ${
                photoType === "real" ? "border-primary bg-primary/5 text-primary" : "text-muted-foreground"
              }`}
            >
              📷 Sí, son fotos reales
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPhotoType("referencial")}
              aria-pressed={photoType === "referencial"}
              className={`h-auto flex-1 whitespace-normal py-2 ${
                photoType === "referencial" ? "border-primary bg-primary/5 text-primary" : "text-muted-foreground"
              }`}
            >
              🌐 No, son referenciales
            </Button>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {photoType
              ? PHOTO_TYPE_HELP[photoType]
              : "Las publicaciones con fotos reales generan más confianza y se venden más rápido."}
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={loading} size="lg" className="w-full rounded-full">
          {loading ? "Guardando..." : isEdit ? "Guardar cambios" : "Publicar figura"}
        </Button>
      </form>
    </Card>
  );
}
