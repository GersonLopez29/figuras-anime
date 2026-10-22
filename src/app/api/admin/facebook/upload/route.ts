import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getCurrentUser, isAdmin } from "@/lib/session";
import { FACEBOOK_TMP_PREFIX, facebookEnabled } from "@/lib/facebook";

// Permiso para que el navegador del admin suba el video directo a Vercel Blob
// (sin pasar por el servidor: los videos pueden pesar más de lo que acepta una
// función de Vercel). Solo admins, solo videos, en la carpeta temporal.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as HandleUploadBody | null;
  if (!body) return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });

  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const user = await getCurrentUser();
        if (!isAdmin(user)) throw new Error("No autorizado");
        if (!facebookEnabled()) throw new Error("Facebook no está configurado");
        if (!pathname.startsWith(FACEBOOK_TMP_PREFIX)) throw new Error("Ruta no permitida");
        return {
          allowedContentTypes: ["video/mp4", "video/webm"],
          maximumSizeInBytes: 60 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
    });
    return NextResponse.json(json);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "No se pudo preparar la subida" },
      { status: 400 }
    );
  }
}
