"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ACCENTS, H, W, planVideo, recordVideo, pickRecorderType } from "@/lib/animeVideo";

export type VideoListing = {
  id: string;
  title: string;
  path: string;
  category: string;
  priceLabel: string; // "S/ 230"
  priceText: string; // "S/ 230.00"
  conditionChip: string; // "NUEVA" | "OPEN BOX" | "USADA"
  images: string[];
};

const KANJIS = [
  { value: "忍", label: "忍 ninja" },
  { value: "超", label: "超 súper" },
  { value: "王", label: "王 rey" },
  { value: "力", label: "力 poder" },
  { value: "炎", label: "炎 fuego" },
  { value: "龍", label: "龍 dragón" },
  { value: "", label: "Sin kanji" },
];

const TAGS = ["¡RECIÉN LLEGADA!", "¡EN OFERTA!", "¡ÚLTIMA UNIDAD!", "¡PREVENTA!"];

// Mismo arreglo del título que en los videos hechos a mano ("Sh Figuarts" ->
// "S.H.Figuarts").
function cleanTitle(t: string) {
  return t.replace(/\s+/g, " ").trim().replace(/\bs\.?\s*h\.?\s*figuarts\b/gi, "S.H.Figuarts");
}

function guessChips(l: VideoListing) {
  const chips = [l.conditionChip];
  if (/figuarts|bandai|ichiban|banpresto|tamashii/i.test(l.title)) chips.push("ORIGINAL BANDAI");
  if (/figuarts/i.test(l.title)) chips.push("S.H.FIGUARTS");
  else if (/ichiban/i.test(l.title)) chips.push("ICHIBAN KUJI");
  return chips;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo cargar una foto"));
    // Por el optimizador de imágenes de la propia página: mismo dominio, así
    // el canvas se puede grabar (con fotos de otro dominio el navegador lo bloquea).
    img.src = `/_next/image?url=${encodeURIComponent(src)}&w=1080&q=75`;
  });
}

export default function TikTokVideoGenerator({ listings }: { listings: VideoListing[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(listings[0]?.id ?? "");
  const [accent, setAccent] = useState("naranja");
  const [kanji, setKanji] = useState("忍");
  const [tag, setTag] = useState(TAGS[0]);
  const [sfx, setSfx] = useState(true);
  const [title, setTitle] = useState(() => (listings[0] ? cleanTitle(listings[0].title) : ""));
  const [chips, setChips] = useState(() => (listings[0] ? guessChips(listings[0]).join(", ") : ""));
  const [status, setStatus] = useState<"idle" | "loading" | "recording" | "done" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ url: string; ext: string; size: number } | null>(null);

  const selected = listings.find((l) => l.id === selectedId);
  const filtered = listings.filter((l) => l.title.toLowerCase().includes(query.trim().toLowerCase()));

  // Al elegir otra figura se proponen título y etiquetas (se pueden editar).
  function choose(l: VideoListing) {
    setSelectedId(l.id);
    setTitle(cleanTitle(l.title));
    setChips(guessChips(l).join(", "));
    setResult(null);
  }

  useEffect(() => {
    return () => {
      if (result) URL.revokeObjectURL(result.url);
    };
  }, [result]);

  async function generate() {
    if (!selected || !canvasRef.current) return;
    if (!pickRecorderType()) {
      setError("Este navegador no puede grabar video. Ábrelo en Chrome o Edge en una computadora.");
      setStatus("error");
      return;
    }
    setError(null);
    setResult(null);
    setStatus("loading");
    setProgress(0);
    try {
      // La letra de la página (Geist), con respaldo sin serifa.
      const pageFont = getComputedStyle(document.body).fontFamily;
      const fontFamily = `${pageFont ? `${pageFont}, ` : ""}system-ui, sans-serif`;
      await Promise.all([
        document.fonts.load(`900 60px ${fontFamily}`),
        document.fonts.load(`700 40px ${fontFamily}`),
      ]).catch(() => null);
      const photos = await Promise.all(selected.images.slice(0, 5).map(loadImage));
      if (photos.length === 0) throw new Error("La figura no tiene fotos");
      const plan = planVideo({
        title: title.trim() || cleanTitle(selected.title),
        priceLabel: selected.priceLabel,
        chips: chips
          .split(",")
          .map((c) => c.trim().toUpperCase())
          .filter(Boolean)
          .slice(0, 3),
        tag,
        kanji,
        sfx,
        accent: ACCENTS[accent].rgb,
        photos,
        fontFamily,
      });
      setStatus("recording");
      const { blob, ext } = await recordVideo(canvasRef.current, plan, setProgress);
      setResult({ url: URL.createObjectURL(blob), ext, size: blob.size });
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo generar el video");
      setStatus("error");
    }
  }

  const busy = status === "loading" || status === "recording";
  const fileName = selected
    ? `${selected.path.split("/").pop()}-tiktok.${result?.ext ?? "mp4"}`
    : "video.mp4";

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_320px]">
      <Card className="gap-4 p-5">
        <div>
          <h2 className="text-lg font-bold text-foreground">🎬 Video para TikTok / Reels</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Estilo anime (vertical 1080×1920) con las fotos, el precio y gerstore.club. Se arma en tu
            navegador en unos 10-16 segundos: no cambies de pestaña mientras se genera.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="video-search">Figura</Label>
          <Input
            id="video-search"
            placeholder="Buscar por nombre…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="max-h-56 overflow-y-auto rounded-lg border border-border">
            {filtered.length === 0 && (
              <p className="p-3 text-sm text-muted-foreground">Sin resultados.</p>
            )}
            {filtered.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => choose(l)}
                className={`flex w-full items-center justify-between gap-3 border-b border-border px-3 py-2 text-left text-sm last:border-b-0 ${
                  l.id === selectedId ? "bg-primary/10 font-semibold" : "hover:bg-muted"
                }`}
              >
                <span className="line-clamp-1">{l.title}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {l.priceText} · {l.images.length} 📷
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="video-title">Título en el video</Label>
            <Input id="video-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="video-chips">Etiquetas (separadas por coma, máx. 3)</Label>
            <Input id="video-chips" value={chips} onChange={(e) => setChips(e.target.value)} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Color del personaje</Label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(ACCENTS).map(([key, a]) => (
              <button
                key={key}
                type="button"
                onClick={() => setAccent(key)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                  accent === key ? "ring-2 ring-foreground" : "ring-border"
                }`}
              >
                <span
                  className="h-3.5 w-3.5 rounded-full"
                  style={{ backgroundColor: `rgb(${a.rgb.join(",")})` }}
                />
                {a.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="video-kanji">Kanji de fondo</Label>
            <select
              id="video-kanji"
              value={kanji}
              onChange={(e) => setKanji(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
            >
              {KANJIS.map((k) => (
                <option key={k.label} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="video-tag">Etiqueta superior</Label>
            <select
              id="video-tag"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
            >
              {TAGS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <label className="flex items-end gap-2 pb-2 text-sm">
            <input
              type="checkbox"
              checked={sfx}
              onChange={(e) => setSfx(e.target.checked)}
              className="size-4 accent-orange-600"
            />
            Onomatopeyas ゴゴゴ
          </label>
        </div>

        <Button
          type="button"
          onClick={generate}
          disabled={busy || !selected}
          size="lg"
          className="rounded-full font-bold"
        >
          {status === "loading"
            ? "Cargando fotos…"
            : status === "recording"
              ? `Grabando… ${Math.round(progress * 100)}%`
              : "🎬 Generar video"}
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}

        {result && (
          <div className="rounded-lg bg-green-50 p-4 text-sm text-green-900 dark:bg-green-950/40 dark:text-green-200">
            <p className="font-semibold">✅ Video listo ({(result.size / 1048576).toFixed(1)} MB)</p>
            <a
              href={result.url}
              download={fileName}
              className="mt-2 inline-flex rounded-full bg-green-600 px-4 py-2 font-bold text-white hover:bg-green-700"
            >
              ⬇️ Descargar {fileName}
            </a>
            <p className="mt-2 text-xs">
              Va sin música: al subirlo, agrega un sonido en tendencia desde TikTok o Instagram.
            </p>
          </div>
        )}
      </Card>

      <div className="space-y-3">
        <p className="text-sm font-semibold text-foreground">Vista previa</p>
        {result && (
          <video
            src={result.url}
            controls
            playsInline
            className="aspect-[9/16] w-full rounded-xl bg-black"
          />
        )}
        {/* El lienzo siempre existe (para volver a generar); se oculta con el video listo. */}
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className={`aspect-[9/16] w-full rounded-xl bg-zinc-900 ${result ? "hidden" : ""}`}
        />
      </div>
    </div>
  );
}
