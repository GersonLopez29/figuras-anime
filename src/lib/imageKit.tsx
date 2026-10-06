import { join } from "node:path";
import { readFile } from "node:fs/promises";
import { isNewCondition, isOpenBoxCondition } from "@/lib/condition";

// Piezas compartidas por las imágenes generadas (vista previa al compartir,
// historias de una figura y el "Top de la semana").

export const SITE_HOST = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://gerstore.club").replace(
  /^https?:\/\//,
  ""
);

export const ORANGE = "#ea580c";
export const RED = "#dc2626";
export const GREEN = "#15803d";
export const INK = "#18181b";
export const MUTED = "#71717a";

// Geist (licencia OFL, ver assets/fonts/OFL-Geist.txt). Se lee una sola vez.
export const fontsPromise = Promise.all(
  [
    { file: "Geist-Medium.ttf", weight: 500 as const },
    { file: "Geist-Bold.ttf", weight: 700 as const },
    { file: "Geist-Black.ttf", weight: 900 as const },
  ].map(async ({ file, weight }) => ({
    name: "Geist",
    data: await readFile(join(process.cwd(), "assets/fonts", file)),
    weight,
    style: "normal" as const,
  }))
);

export type ImageFonts = Awaited<typeof fontsPromise>;

// Baja la foto de la figura y la recorta a width×height como JPEG. Se pasa por
// sharp porque el generador de imágenes no lee WebP y las fotos del celular
// pueden pesar varios MB. Si algo falla, devuelve null y la imagen se arma sin
// foto.
export async function loadPhoto(
  url: string | undefined,
  width: number,
  height: number
): Promise<string | null> {
  if (!url) return null;
  try {
    let buffer: Buffer;
    if (url.startsWith("/")) {
      // Desarrollo local sin Vercel Blob: las fotos viven en /public.
      buffer = await readFile(join(process.cwd(), "public", url));
    } else {
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) return null;
      buffer = Buffer.from(await res.arrayBuffer());
    }
    const sharp = (await import("sharp")).default;
    const jpeg = await sharp(buffer)
      .rotate()
      .resize(width, height, { fit: "cover" })
      .jpeg({ quality: 82 })
      .toBuffer();
    return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  } catch (err) {
    console.error("[image] No se pudo cargar la foto:", err);
    return null;
  }
}

export function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
}

export function conditionLabel(condition: string): string {
  if (isNewCondition(condition)) return "Nueva";
  if (isOpenBoxCondition(condition)) return "Open box";
  return "Usada";
}

// Arma la imagen completa antes de responder (en vez de transmitirla mientras
// se genera). Si la generación falla, se reintenta una vez y, si vuelve a
// fallar, se responde un error 500 claro en lugar de una respuesta vacía.
export async function renderPngWithRetry(
  render: () => Promise<Response>
): Promise<ArrayBuffer | null> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await render();
      return await response.arrayBuffer();
    } catch (err) {
      console.error(`[image] Falló la generación (intento ${attempt}):`, err);
    }
  }
  return null;
}
