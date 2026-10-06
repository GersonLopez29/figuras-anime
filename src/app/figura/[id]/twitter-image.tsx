import { listingIdFromParam } from "@/lib/slug";
import { renderListingShareImage, SHARE_IMAGE_ALT, SHARE_IMAGE_SIZE } from "@/lib/listingShareImage";

// Vista previa al compartir la figura (WhatsApp, Facebook, X…). Se regenera
// como máximo cada 10 minutos para reflejar cambios de precio o si se vendió.
export const revalidate = 600;
export const alt = SHARE_IMAGE_ALT;
export const size = SHARE_IMAGE_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return renderListingShareImage(listingIdFromParam(id));
}
