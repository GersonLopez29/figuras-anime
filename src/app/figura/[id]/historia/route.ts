import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { renderListingStory } from "@/lib/storyImage";
import { listingIdFromParam } from "@/lib/slug";
import { renderPngWithRetry } from "@/lib/imageKit";

// Imagen vertical 1080×1920 de la figura para historias (Instagram, Facebook,
// WhatsApp, TikTok). Con ?descargar=1 el navegador la baja como archivo.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: param } = await params;
  const id = listingIdFromParam(param);
  const exists = await prisma.listing.findUnique({ where: { id }, select: { id: true } });
  if (!exists) {
    return NextResponse.json({ error: "Publicación no encontrada" }, { status: 404 });
  }

  const png = await renderPngWithRetry(async () => (await renderListingStory(id))!);
  if (!png) {
    return NextResponse.json({ error: "No se pudo generar la imagen" }, { status: 500 });
  }

  const headers = new Headers({
    "Content-Type": "image/png",
    "Cache-Control": "public, max-age=0, s-maxage=600, stale-while-revalidate=3600",
  });
  if (request.nextUrl.searchParams.get("descargar") === "1") {
    headers.set("Content-Disposition", `attachment; filename="figurasanime-${id}-historia.png"`);
  }
  return new Response(png, { status: 200, headers });
}
