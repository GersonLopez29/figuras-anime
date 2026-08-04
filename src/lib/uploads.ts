import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { put, del } from "@vercel/blob";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
const MAX_SIZE = 5 * 1024 * 1024;

const useBlobStorage = !!process.env.BLOB_READ_WRITE_TOKEN;

export async function saveUploadedImage(file: File): Promise<string> {
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    throw new Error("Formato de imagen no permitido. Usa JPG, PNG, WEBP o GIF.");
  }
  if (file.size > MAX_SIZE) {
    throw new Error("Cada imagen debe pesar menos de 5MB.");
  }

  const filename = `${randomUUID()}.${ext}`;

  if (useBlobStorage) {
    const blob = await put(`uploads/${filename}`, file, {
      access: "public",
      contentType: file.type,
    });
    return blob.url;
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);

  return `/uploads/${filename}`;
}

export async function deleteUploadedImage(url: string) {
  if (useBlobStorage && url.includes("blob.vercel-storage.com")) {
    try {
      await del(url);
    } catch {
      // El archivo ya no existe, no pasa nada.
    }
    return;
  }

  if (!url.startsWith("/uploads/")) return;
  const filePath = path.join(process.cwd(), "public", url);
  try {
    await unlink(filePath);
  } catch {
    // El archivo ya no existe, no pasa nada.
  }
}
