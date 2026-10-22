// Subir los videos del generador como Reel en BORRADOR a la página de Facebook
// de GerStore (Reels Publishing API de Meta). Queda en borrador para que el
// admin le ponga música y lo publique desde Meta Business Suite o la app.
//
// Requiere en Vercel:
//   FACEBOOK_PAGE_ID     ID numérico de la página
//   FACEBOOK_PAGE_TOKEN  token de página permanente con pages_show_list,
//                        pages_read_engagement y pages_manage_posts
// Opcional: FACEBOOK_GRAPH_VERSION (por defecto v26.0).
//
// Documentación: https://developers.facebook.com/docs/video-api/guides/reels-publishing

const GRAPH_VERSION = process.env.FACEBOOK_GRAPH_VERSION ?? "v26.0";
// FACEBOOK_GRAPH_BASE solo se usa para pruebas locales con un simulador.
const GRAPH = `${process.env.FACEBOOK_GRAPH_BASE ?? "https://graph.facebook.com"}/${GRAPH_VERSION}`;

// Carpeta temporal en Vercel Blob: Facebook descarga el video desde ahí.
export const FACEBOOK_TMP_PREFIX = "facebook-tmp/";

export function facebookEnabled(): boolean {
  return !!process.env.FACEBOOK_PAGE_ID && !!process.env.FACEBOOK_PAGE_TOKEN;
}

type GraphError = { error?: { message?: string; code?: number; error_subcode?: number } };

// Mensajes claros para los errores más comunes de Meta.
function friendlyError(data: GraphError, status: number): string {
  const e = data.error;
  if (e?.code === 190) {
    return "El token de Facebook venció o no es válido. Genera uno nuevo y actualiza FACEBOOK_PAGE_TOKEN en Vercel.";
  }
  if (e?.code === 10 || e?.code === 200 || e?.code === 3) {
    return "Al token le faltan permisos (pages_manage_posts, pages_read_engagement, pages_show_list) o no es de la página.";
  }
  if (e?.code === 4 || e?.code === 32 || e?.code === 368) {
    return "Facebook está limitando las publicaciones por ahora. Intenta más tarde.";
  }
  return e?.message ? `Facebook respondió: ${e.message}` : `Facebook respondió ${status}`;
}

async function graph<T>(url: string, init: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, cache: "no-store" });
  const data = (await res.json().catch(() => ({}))) as T & GraphError;
  if (!res.ok || data.error) throw new Error(friendlyError(data, res.status));
  return data;
}

export type FacebookDraft = { videoId: string; uploaded: boolean };

// Sube el video (desde una URL pública) y lo deja como borrador en la página.
export async function createReelDraft(videoUrl: string, description: string): Promise<FacebookDraft> {
  const pageId = process.env.FACEBOOK_PAGE_ID!;
  const token = process.env.FACEBOOK_PAGE_TOKEN!;

  // 1. Iniciar: Facebook reserva el video y da la URL de subida.
  const start = await graph<{ video_id: string; upload_url?: string }>(`${GRAPH}/${pageId}/video_reels`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ upload_phase: "start", access_token: token }),
  });
  const videoId = start.video_id;

  // 2. Subir: Facebook descarga el archivo desde file_url.
  await graph<{ success?: boolean }>(
    start.upload_url ?? `https://rupload.facebook.com/video-upload/${GRAPH_VERSION}/${videoId}`,
    { method: "POST", headers: { Authorization: `OAuth ${token}`, file_url: videoUrl } }
  );

  // 3. Terminar como BORRADOR (no se publica).
  const finish = new URLSearchParams({
    access_token: token,
    video_id: videoId,
    upload_phase: "finish",
    video_state: "DRAFT",
    description,
  });
  await graph(`${GRAPH}/${pageId}/video_reels?${finish}`, { method: "POST" });

  // Espera (hasta ~20 s) a que Facebook termine de copiar el archivo, para
  // poder borrar la copia temporal sin cortarle la descarga.
  let uploaded = false;
  for (let i = 0; i < 10 && !uploaded; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const status = await graph<{ status?: { uploading_phase?: { status?: string } } }>(
      `${GRAPH}/${videoId}?fields=status&access_token=${encodeURIComponent(token)}`,
      { method: "GET" }
    ).catch(() => null);
    uploaded = status?.status?.uploading_phase?.status === "complete";
  }
  return { videoId, uploaded };
}
