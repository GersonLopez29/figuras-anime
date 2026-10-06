// Si las fotos de una publicación son de la figura que se vende o sacadas de
// internet. Las publicaciones anteriores a esta opción no tienen valor (null).
export const PHOTO_TYPES = ["real", "referencial"] as const;
export type PhotoType = (typeof PHOTO_TYPES)[number];

export function isValidPhotoType(value: unknown): value is PhotoType {
  return typeof value === "string" && (PHOTO_TYPES as readonly string[]).includes(value);
}

export const PHOTO_TYPE_LABEL: Record<PhotoType, string> = {
  real: "📷 Fotos reales",
  referencial: "🌐 Fotos referenciales",
};

export const PHOTO_TYPE_HELP: Record<PhotoType, string> = {
  real: "Las fotos son de la figura que se vende.",
  referencial: "Las fotos son de referencia (de internet o del fabricante); pide fotos reales al vendedor.",
};
