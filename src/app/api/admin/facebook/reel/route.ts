import { NextResponse, after } from "next/server";
import { z } from "zod";
import { del, list } from "@vercel/blob";
import { getCurrentUser, isAdmin } from "@/lib/session";
import { FACEBOOK_TMP_PREFIX, createReelDraft, facebookEnabled } from "@/lib/facebook";

export const maxDuration = 60;

const schema = z.object({
  videoUrl: z.string().url(),
  description: z.string().trim().max(2200),
});

const DAY_MS = 24 * 60 * 60 * 1000;

// Borra copias temporales que hayan quedado de subidas anteriores.
async function cleanupOldTmp() {
  const { blobs } = await list({ prefix: FACEBOOK_TMP_PREFIX, limit: 100 });
  const old = blobs.filter((b) => Date.now() - new Date(b.uploadedAt).getTime() > DAY_MS);
  if (old.length) await del(old.map((b) => b.url));
}

// Crea el Reel en BORRADOR en la página de Facebook a partir del video que el
// navegador ya subió a la carpeta temporal de Vercel Blob.
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!isAdmin(user)) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  if (!facebookEnabled()) {
    return NextResponse.json({ error: "Falta configurar Facebook en Vercel" }, { status: 503 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  const { videoUrl, description } = parsed.data;
  // Solo videos de la carpeta temporal de nuestro Blob.
  const url = new URL(videoUrl);
  if (!url.hostname.endsWith(".blob.vercel-storage.com") || !url.pathname.startsWith(`/${FACEBOOK_TMP_PREFIX}`)) {
    return NextResponse.json({ error: "Video inválido" }, { status: 400 });
  }

  try {
    const draft = await createReelDraft(videoUrl, description);
    after(async () => {
      try {
        if (draft.uploaded) await del(videoUrl);
        await cleanupOldTmp();
      } catch (err) {
        console.error("[facebook] limpieza:", err);
      }
    });
    return NextResponse.json({ videoId: draft.videoId });
  } catch (err) {
    console.error("[facebook]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "No se pudo enviar a Facebook" },
      { status: 502 }
    );
  }
}
