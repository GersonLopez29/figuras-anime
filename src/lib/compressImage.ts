// Achica las fotos en el navegador antes de subirlas.
//
// Vercel rechaza cualquier envío de más de 4.5 MB en total, y una foto de
// celular pesa entre 2 y 5 MB: con 3 o 4 fotos la publicación fallaba antes de
// llegar al servidor. Una foto de 1600 px de lado en JPEG pesa ~200-400 KB y se
// ve igual de bien en la página (las tarjetas y la ficha muestran mucho menos).
//
// Solo para componentes del navegador ("use client").

const MAX_SIDE = 1600;
const QUALITY = 0.82;
// Fotos chicas y livianas se suben tal cual.
const SKIP_BELOW_BYTES = 400 * 1024;
// Límite de Vercel (4.5 MB) con margen para el resto del formulario.
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la imagen"));
    };
    img.src = url;
  });
}

// Devuelve la foto achicada en JPEG, o la original si no se puede o no conviene
// (GIF animados, formatos que el navegador no lee, o si no queda más liviana).
export async function compressImage(
  file: File,
  maxSide = MAX_SIDE,
  quality = QUALITY
): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  try {
    // El navegador ya aplica la rotación de la foto (EXIF) al dibujar una <img>.
    const img = await loadImage(file);
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    if (scale === 1 && file.size <= SKIP_BELOW_BYTES) return file;

    const width = Math.round(img.naturalWidth * scale);
    const height = Math.round(img.naturalHeight * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    // Fondo blanco: JPEG no tiene transparencia (PNG con fondo transparente).
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );
    if (!blob || blob.size >= file.size) return file;
    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return file;
  }
}

function totalBytes(files: File[]) {
  return files.reduce((sum, f) => sum + f.size, 0);
}

// Achica todas las fotos; si juntas todavía pasan el límite, hace una segunda
// pasada más fuerte.
export async function prepareImagesForUpload(files: File[]): Promise<File[]> {
  const first = await Promise.all(files.map((f) => compressImage(f)));
  if (totalBytes(first) <= MAX_UPLOAD_BYTES) return first;
  return Promise.all(files.map((f) => compressImage(f, 1200, 0.7)));
}

// Mensaje para el error 413 de Vercel (envío demasiado pesado).
export const TOO_LARGE_MESSAGE =
  "Las fotos pesan demasiado para subirlas juntas. Prueba con menos fotos o con fotos más livianas.";

export function uploadErrorMessage(status: number, serverMessage?: string): string {
  if (status === 413) return TOO_LARGE_MESSAGE;
  return serverMessage ?? "Ocurrió un error, intenta de nuevo";
}
