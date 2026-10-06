import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/session";
import { renderWeeklyImage, type WeeklyFormat } from "@/lib/storyImage";
import { renderPngWithRetry } from "@/lib/imageKit";

// "Novedades de la semana" para redes: ?formato=historia (1080×1920) o
// ?formato=post (1080×1350). Solo para el administrador.
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!isAdmin(user)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const format: WeeklyFormat =
    request.nextUrl.searchParams.get("formato") === "post" ? "post" : "historia";
  const png = await renderPngWithRetry(() => renderWeeklyImage(format));
  if (!png) {
    return NextResponse.json({ error: "No se pudo generar la imagen" }, { status: 500 });
  }

  const headers = new Headers({ "Content-Type": "image/png", "Cache-Control": "private, no-store" });
  if (request.nextUrl.searchParams.get("descargar") === "1") {
    const date = new Date().toISOString().slice(0, 10);
    headers.set(
      "Content-Disposition",
      `attachment; filename="figurasanime-novedades-${date}-${format}.png"`
    );
  }
  return new Response(png, { status: 200, headers });
}
