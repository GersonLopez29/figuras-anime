// Service worker de FigurasAnime: lo mínimo para que la página sea instalable
// como app. No guarda páginas en caché (los precios y el stock cambian), solo
// muestra un aviso amable cuando no hay internet.
const OFFLINE_HTML = `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Sin conexión · FigurasAnime</title>
<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;background:#fafafa;color:#18181b;text-align:center;padding:24px}
.c{max-width:340px}h1{font-size:22px;margin:12px 0 8px}p{color:#52525b;font-size:15px;line-height:1.5}
button{margin-top:16px;border:0;border-radius:999px;background:#ea580c;color:#fff;font-weight:700;font-size:15px;padding:12px 24px}</style></head>
<body><div class="c"><div style="font-size:48px">🎌</div><h1>Sin conexión</h1>
<p>No hay internet en este momento. Revisa tus datos o el Wi-Fi y vuelve a intentarlo.</p>
<button onclick="location.reload()">Reintentar</button></div></body></html>`;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  // Solo las páginas (navegación); imágenes, datos, etc. siguen su camino normal.
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    fetch(event.request).catch(
      () => new Response(OFFLINE_HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } })
    )
  );
});
