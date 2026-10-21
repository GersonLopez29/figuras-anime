// Subir archivos a Google Drive desde el navegador (solo "use client").
//
// Usa Google Identity Services: Google abre una ventanita para elegir la cuenta
// y dar permiso, y entrega un token temporal (1 hora) que nunca pasa por
// nuestro servidor. El permiso pedido es "drive.file": la página solo puede
// ver y crear los archivos que ella misma sube, no el resto del Drive.
//
// Requiere NEXT_PUBLIC_GOOGLE_CLIENT_ID (ID de cliente OAuth "Aplicación web"
// de Google Cloud, con https://gerstore.club como origen autorizado).

export const DRIVE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
const SCOPE = "https://www.googleapis.com/auth/drive.file";
export const DRIVE_FOLDER_NAME = "GerStore - Videos TikTok";
const GIS_SRC = "https://accounts.google.com/gsi/client";
const API = "https://www.googleapis.com";

type TokenResponse = { access_token?: string; expires_in?: number; error?: string };
type TokenClient = { requestAccessToken: (opts?: { prompt?: string }) => void };
type GoogleOAuth = {
  accounts: {
    oauth2: {
      initTokenClient: (config: {
        client_id: string;
        scope: string;
        callback: (r: TokenResponse) => void;
        error_callback?: (e: { type?: string; message?: string }) => void;
      }) => TokenClient;
    };
  };
};

let scriptPromise: Promise<void> | null = null;
let cachedToken: { value: string; expiresAt: number } | null = null;

// Carga el script de Google una sola vez (se llama apenas el video está listo,
// así al tocar el botón la ventanita de permiso abre al instante).
export function loadGoogleScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if ((window as unknown as { google?: GoogleOAuth }).google?.accounts?.oauth2) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = GIS_SRC;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => {
        scriptPromise = null;
        reject(new Error("No se pudo conectar con Google. Revisa tu conexión."));
      };
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
}

function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return Promise.resolve(cachedToken.value);
  }
  const google = (window as unknown as { google?: GoogleOAuth }).google;
  if (!google?.accounts?.oauth2) return Promise.reject(new Error("Google no terminó de cargar"));
  return new Promise((resolve, reject) => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: DRIVE_CLIENT_ID,
      scope: SCOPE,
      callback: (r) => {
        if (r.error || !r.access_token) {
          reject(new Error("Google no dio permiso para guardar en Drive"));
          return;
        }
        cachedToken = { value: r.access_token, expiresAt: Date.now() + (r.expires_in ?? 3600) * 1000 };
        resolve(r.access_token);
      },
      error_callback: (e) =>
        reject(
          new Error(
            e.type === "popup_closed"
              ? "Cerraste la ventana de Google antes de dar permiso"
              : e.type === "popup_failed_to_open"
                ? "El navegador bloqueó la ventana de Google: permite ventanas emergentes para gerstore.club"
                : "No se pudo conectar con Google"
          )
        ),
    });
    client.requestAccessToken();
  });
}

async function driveFetch(token: string, url: string, init: RequestInit = {}) {
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init.headers ?? {}) },
  });
  if (res.status === 401) cachedToken = null;
  if (!res.ok) throw new Error(`Google Drive respondió ${res.status}`);
  return res;
}

// Carpeta "GerStore - Videos TikTok" (la crea la primera vez). Con el
// permiso drive.file solo se ven las carpetas que creó la propia página.
async function ensureFolder(token: string): Promise<string> {
  const q = encodeURIComponent(
    `name = '${DRIVE_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
  );
  const list = await driveFetch(token, `${API}/drive/v3/files?q=${q}&fields=files(id)&spaces=drive`);
  const found = (await list.json()) as { files?: { id: string }[] };
  if (found.files?.[0]) return found.files[0].id;
  const created = await driveFetch(token, `${API}/drive/v3/files?fields=id`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: DRIVE_FOLDER_NAME, mimeType: "application/vnd.google-apps.folder" }),
  });
  return ((await created.json()) as { id: string }).id;
}

function putWithProgress(
  url: string,
  blob: Blob,
  onProgress: (f: number) => void
): Promise<{ id: string; webViewLink?: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", blob.type || "application/octet-stream");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded / e.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          reject(new Error("Respuesta inesperada de Google Drive"));
        }
      } else reject(new Error(`Google Drive respondió ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error("Se cortó la subida. Revisa tu conexión."));
    xhr.send(blob);
  });
}

export type DriveFile = { id: string; webViewLink: string };

// Pide permiso (la primera vez), y sube el archivo a la carpeta de videos.
// onProgress de 0 a 1 durante la subida.
export async function uploadToDrive(
  blob: Blob,
  name: string,
  onProgress: (fraction: number) => void
): Promise<DriveFile> {
  if (!DRIVE_CLIENT_ID) throw new Error("Falta configurar la conexión con Google Drive");
  await loadGoogleScript();
  const token = await getAccessToken();
  const folderId = await ensureFolder(token);
  // Subida "reanudable": sirve para videos grandes y permite mostrar el avance.
  const start = await driveFetch(
    token,
    `${API}/upload/drive/v3/files?uploadType=resumable&fields=id,webViewLink`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": blob.type || "video/mp4",
        "X-Upload-Content-Length": String(blob.size),
      },
      body: JSON.stringify({ name, parents: [folderId], mimeType: blob.type || "video/mp4" }),
    }
  );
  const sessionUrl = start.headers.get("Location");
  if (!sessionUrl) throw new Error("Google Drive no aceptó la subida");
  const file = await putWithProgress(sessionUrl, blob, onProgress);
  return {
    id: file.id,
    webViewLink: file.webViewLink ?? `https://drive.google.com/file/d/${file.id}/view`,
  };
}
