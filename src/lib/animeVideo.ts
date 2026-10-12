// Motor del video estilo anime para TikTok/Reels (1080x1920), dibujado en un
// <canvas> del navegador y grabado con MediaRecorder: no usa el servidor.
// Es el mismo diseño que los videos hechos a mano: líneas de velocidad de
// manga, trama de puntos, kanji gigante, shurikens, onomatopeyas (ゴゴゴ),
// viñetas con borde blanco y destellos, y la tarjeta final con gerstore.club.
// Solo para componentes del navegador ("use client").

export const W = 1080;
export const H = 1920;
export const FPS = 30;
const SAFE_LEFT = 72;
const SAFE_RIGHT = W - 170;
const PANEL_CENTER_Y = 800;
const PANEL_MAX = { w: 880, h: 860 };
const INFO_TOP = 1300;
const PHOTO_SECONDS = 2.6;
const END_SECONDS = 3.2;
const INTRO_FRAMES = 14;
const FLASH_FRAMES = 5;
const ORANGE = "rgb(249,115,22)";
const INK = "rgb(10,10,10)";

export type RGB = [number, number, number];

export const ACCENTS: Record<string, { label: string; rgb: RGB }> = {
  naranja: { label: "Naranja", rgb: [251, 146, 60] },
  rojo: { label: "Rojo", rgb: [239, 68, 68] },
  azul: { label: "Azul", rgb: [59, 130, 246] },
  jade: { label: "Jade", rgb: [52, 211, 153] },
  lavanda: { label: "Lavanda", rgb: [196, 160, 255] },
  dorado: { label: "Dorado", rgb: [250, 204, 21] },
};

export type VideoOptions = {
  title: string;
  priceLabel: string; // "S/ 365"
  chips: string[]; // ["NUEVA", "ORIGINAL BANDAI"]
  tag: string; // "¡RECIÉN LLEGADA!"
  kanji: string; // "忍"
  sfx: boolean;
  accent: RGB;
  photos: HTMLImageElement[];
  fontFamily: string; // familia de la página (Geist)
};

const rgba = (c: RGB, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

// Números pseudoaleatorios repetibles (mismo dibujo en cada cuadro).
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function makeCanvas(w = W, h = H) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

function speedLines(seed: number, accent: RGB) {
  const c = makeCanvas();
  const ctx = c.getContext("2d")!;
  const rnd = seeded(seed);
  const cx = W / 2;
  const cy = PANEL_CENTER_Y;
  for (let i = 0; i < 170; i++) {
    const ang = rnd() * Math.PI * 2;
    const r0 = 430 + rnd() * 190;
    const r1 = 1900;
    const spread = 0.004 + rnd() * 0.012;
    const color: RGB = rnd() < 0.35 ? accent : [255, 255, 255];
    ctx.fillStyle = rgba(color, (26 + rnd() * 44) / 255);
    ctx.beginPath();
    ctx.moveTo(cx + r0 * Math.cos(ang), cy + r0 * Math.sin(ang));
    ctx.lineTo(cx + r1 * Math.cos(ang - spread), cy + r1 * Math.sin(ang - spread));
    ctx.lineTo(cx + r1 * Math.cos(ang + spread), cy + r1 * Math.sin(ang + spread));
    ctx.fill();
  }
  return c;
}

function background(accent: RGB, kanji: string, font: string) {
  const c = makeCanvas();
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "rgb(14,11,10)";
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, PANEL_CENTER_Y, 0, W / 2, PANEL_CENTER_Y, 760);
  glow.addColorStop(0, rgba(accent, 0.42));
  glow.addColorStop(1, rgba(accent, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  if (kanji) {
    ctx.fillStyle = rgba(accent, 0.12);
    ctx.font = `900 1000px ${font}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(kanji, W / 2, PANEL_CENTER_Y + 40);
  }
  // Trama de puntos (manga) que crece hacia abajo.
  const step = 26;
  for (let y = 1150; y < H; y += step) {
    const k = (y - 1150) / (H - 1150);
    const r = 1.5 + 6 * k;
    ctx.fillStyle = rgba(accent, (40 * k + 10) / 255);
    for (let x = ((y / step) % 2) * (step / 2); x < W; x += step) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  return c;
}

function drawShuriken(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, angle: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const r = i % 2 === 0 ? size : size * 0.32;
    if (i === 0) ctx.moveTo(r * Math.cos(a), r * Math.sin(a));
    else ctx.lineTo(r * Math.cos(a), r * Math.sin(a));
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgb(20,16,14)";
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(test).width <= maxWidth) cur = test;
    else {
      if (cur) lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    let last = kept[maxLines - 1];
    while (ctx.measureText(`${last}…`).width > maxWidth && last.includes(" ")) {
      last = last.slice(0, last.lastIndexOf(" "));
    }
    kept[maxLines - 1] = `${last}…`;
    return kept;
  }
  return lines;
}

function drawBrand(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, font: string, animeColor: string) {
  ctx.font = `900 ${size}px ${font}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#fff";
  ctx.fillText("Figuras", x, y);
  ctx.fillStyle = animeColor;
  ctx.fillText("Anime", x + ctx.measureText("Figuras").width, y);
}

function infoOverlay(o: VideoOptions) {
  const c = makeCanvas();
  const ctx = c.getContext("2d")!;
  const f = o.fontFamily;
  drawBrand(ctx, SAFE_LEFT, 200, 46, f, ORANGE);
  // Etiqueta inclinada
  ctx.font = `900 32px ${f}`;
  const tw = ctx.measureText(o.tag).width;
  const x0 = SAFE_LEFT;
  const y0 = 268;
  ctx.fillStyle = rgba(o.accent, 1);
  ctx.beginPath();
  ctx.moveTo(x0 + 14, y0);
  ctx.lineTo(x0 + tw + 56, y0);
  ctx.lineTo(x0 + tw + 42, y0 + 50);
  ctx.lineTo(x0, y0 + 50);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgb(15,12,10)";
  ctx.textBaseline = "middle";
  ctx.fillText(o.tag, x0 + 28, y0 + 26);

  // Nombre sobre barra negra inclinada con borde de color
  let y = INFO_TOP;
  ctx.font = `900 62px ${f}`;
  const lines = wrap(ctx, o.title, SAFE_RIGHT - SAFE_LEFT - 40, 2);
  const barH = 84 * lines.length + 24;
  const bw = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 70;
  ctx.fillStyle = "rgba(8,8,8,0.92)";
  ctx.beginPath();
  ctx.moveTo(SAFE_LEFT - 30, y - 12);
  ctx.lineTo(SAFE_LEFT + bw, y - 12);
  ctx.lineTo(SAFE_LEFT + bw - 26, y - 12 + barH);
  ctx.lineTo(SAFE_LEFT - 30, y - 12 + barH);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = rgba(o.accent, 1);
  ctx.beginPath();
  ctx.moveTo(SAFE_LEFT + bw, y - 12);
  ctx.lineTo(SAFE_LEFT + bw + 14, y - 12);
  ctx.lineTo(SAFE_LEFT + bw - 12, y - 12 + barH);
  ctx.lineTo(SAFE_LEFT + bw - 26, y - 12 + barH);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.textBaseline = "top";
  for (const line of lines) {
    ctx.fillText(line, SAFE_LEFT, y);
    y += 84;
  }
  y += 28;
  // Precio con borde grueso
  ctx.font = `900 120px ${f}`;
  ctx.lineJoin = "round";
  ctx.lineWidth = 16;
  ctx.strokeStyle = "rgb(8,8,8)";
  ctx.strokeText(o.priceLabel, SAFE_LEFT, y);
  ctx.fillStyle = ORANGE;
  ctx.fillText(o.priceLabel, SAFE_LEFT, y);
  y += 150;
  // Chips
  ctx.font = `900 30px ${f}`;
  let x = SAFE_LEFT;
  for (const chip of o.chips) {
    const w = ctx.measureText(chip).width + 40;
    if (x + w > SAFE_RIGHT) break;
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.strokeStyle = rgba(o.accent, 1);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(x, y, w, 52, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.textBaseline = "middle";
    ctx.fillText(chip, x + 20, y + 27);
    x += w + 14;
  }
  y += 76;
  ctx.font = `900 44px ${f}`;
  ctx.textBaseline = "top";
  ctx.fillStyle = "#fff";
  ctx.fillText("Pídela en ", SAFE_LEFT, y);
  ctx.fillStyle = ORANGE;
  ctx.fillText("gerstore.club", SAFE_LEFT + ctx.measureText("Pídela en ").width, y);
  return c;
}

function sfxLayer(text: string, accent: RGB, size: number, orient: "h" | "v", font: string) {
  const chars = [...text];
  const step = size * 1.02;
  const c =
    orient === "h"
      ? makeCanvas(Math.ceil(step * chars.length + size * 0.6), Math.ceil(size * 1.6))
      : makeCanvas(Math.ceil(size * 1.6), Math.ceil(step * chars.length + size * 0.6));
  const ctx = c.getContext("2d")!;
  ctx.font = `900 ${size}px ${font}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(10, (size / 11) * 2);
  ctx.strokeStyle = INK;
  ctx.fillStyle = rgba(accent, 0.96);
  chars.forEach((ch, k) => {
    const px = orient === "h" ? size * 0.3 + k * step + size / 2 : c.width / 2;
    const py = orient === "h" ? c.height / 2 : size * 0.3 + k * step + size / 2;
    ctx.strokeText(ch, px, py);
    ctx.fillText(ch, px, py);
  });
  return c;
}

function endCard(o: VideoOptions, bg: HTMLCanvasElement, lines: HTMLCanvasElement) {
  const c = makeCanvas();
  const ctx = c.getContext("2d")!;
  const f = o.fontFamily;
  ctx.drawImage(bg, 0, 0);
  ctx.drawImage(lines, 0, 0);
  ctx.save();
  ctx.translate(W / 2, 520 + 380);
  ctx.rotate((3 * Math.PI) / 180);
  ctx.translate(-450, -380);
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, 900, 760);
  ctx.fillStyle = "rgb(234,88,12)";
  ctx.fillRect(8, 8, 884, 744);
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const rows: [string, string, number, string][] = [
    ["¿La quieres?", `900 100px ${f}`, 70, "#fff"],
    ["Encuéntrala en", `700 50px ${f}`, 220, "rgb(255,237,213)"],
    ["gerstore.club", `900 92px ${f}`, 290, "rgb(15,12,10)"],
    ["Escríbele directo al vendedor", `700 40px ${f}`, 470, "#fff"],
    ["por WhatsApp · sin registrarte", `700 40px ${f}`, 524, "#fff"],
  ];
  for (const [text, font, yy, color] of rows) {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.fillText(text, 450, yy);
  }
  ctx.font = `900 54px ${f}`;
  const bw = ctx.measureText("FigurasAnime").width;
  drawBrand(ctx, 450 - bw / 2, 640, 54, f, "rgb(15,12,10)");
  ctx.restore();
  drawShuriken(ctx, 150, 430, 70, "rgba(230,230,235,0.9)", 0.3);
  drawShuriken(ctx, 930, 1380, 90, "rgba(230,230,235,0.9)", 0.3);
  return c;
}

function drawPanel(
  ctx: CanvasRenderingContext2D,
  photo: HTMLImageElement,
  t: number,
  pan: [number, number],
  tiltDeg: number,
  scale: number
) {
  const pw = photo.naturalWidth;
  const ph = photo.naturalHeight;
  const s = Math.min(PANEL_MAX.w / pw, PANEL_MAX.h / ph);
  const fw = pw * s;
  const fh = ph * s;
  const zoom = 1 + 0.1 * t;
  const cw = pw / zoom;
  const ch = ph / zoom;
  const cx = pw / 2 + (pan[0] * (pw - cw) * t) / 2;
  const cy = ph / 2 + (pan[1] * (ph - ch) * t) / 2;
  const b = 16;
  const o = 7;
  ctx.save();
  ctx.translate(W / 2, PANEL_CENTER_Y);
  ctx.rotate((-tiltDeg * Math.PI) / 180);
  ctx.scale(scale, scale);
  const ow = fw + 2 * (b + o);
  const oh = fh + 2 * (b + o);
  ctx.shadowColor = "rgba(0,0,0,0.75)";
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 20;
  ctx.fillStyle = INK;
  ctx.fillRect(-ow / 2, -oh / 2, ow, oh);
  ctx.shadowColor = "transparent";
  ctx.fillStyle = "#fff";
  ctx.fillRect(-ow / 2 + o, -oh / 2 + o, fw + 2 * b, fh + 2 * b);
  ctx.drawImage(photo, cx - cw / 2, cy - ch / 2, cw, ch, -fw / 2, -fh / 2, fw, fh);
  ctx.restore();
}

export type VideoPlan = {
  totalFrames: number;
  drawFrame: (ctx: CanvasRenderingContext2D, frame: number) => void;
};

// Prepara todo lo fijo una vez y devuelve cómo dibujar cada cuadro.
export function planVideo(o: VideoOptions): VideoPlan {
  const photos = o.photos.slice(0, 5);
  const bg = background(o.accent, o.kanji, o.fontFamily);
  const lines = [1, 2, 3].map((s) => speedLines(s, o.accent));
  const info = infoOverlay(o);
  const end = endCard(o, bg, speedLines(99, o.accent));
  const sfx = o.sfx
    ? [
        { layer: sfxLayer("ゴゴゴゴ", o.accent, 86, "h", o.fontFamily), x: 690, y: 345, rot: -10 },
        { layer: sfxLayer("ドドド", o.accent, 92, "v", o.fontFamily), x: 1000, y: 960, rot: -6 },
      ]
    : [];
  const seg = Math.round(PHOTO_SECONDS * FPS);
  const endFrames = Math.round(END_SECONDS * FPS);
  const totalFrames = seg * photos.length + endFrames;
  const pans: [number, number][] = [
    [0.4, -0.3],
    [-0.4, 0.3],
    [0.3, 0.4],
    [-0.3, -0.4],
    [0, 0.5],
  ];
  const tilts = [-2.5, 2.0, -1.5, 2.5, -2.0];
  const accentCss = rgba(o.accent, 0.92);

  function drawFrame(ctx: CanvasRenderingContext2D, f: number) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    if (f < seg * photos.length) {
      const i = Math.floor(f / seg);
      const k = f % seg;
      ctx.drawImage(bg, 0, 0);
      // Las líneas "tiemblan" cambiando de dibujo cada 3 cuadros.
      ctx.drawImage(lines[Math.floor(f / 3) % 3], 0, 0);
      const s = k < 8 ? 0.85 + 0.15 * (k / 8) : 1;
      drawPanel(ctx, photos[i], k / seg, pans[i % 5], tilts[i % 5], s);
      sfx.forEach((sf, n) => {
        const r1 = seeded(Math.floor(f / 2) * 7 + n)();
        const r2 = seeded(Math.floor(f / 2) * 13 + n)();
        ctx.save();
        ctx.translate(sf.x + (r1 * 12 - 6), sf.y + (r2 * 12 - 6));
        ctx.rotate((sf.rot * Math.PI) / 180);
        ctx.drawImage(sf.layer, -sf.layer.width / 2, -sf.layer.height / 2);
        ctx.restore();
      });
      drawShuriken(ctx, W - 140, 300, 46, accentCss, f * 0.35);
      drawShuriken(ctx, 120, 1240, 38, accentCss, f * -0.45);
      if (f < INTRO_FRAMES) {
        const a = f / INTRO_FRAMES;
        ctx.globalAlpha = a;
        ctx.drawImage(info, (1 - a) * -80, 0);
        ctx.globalAlpha = 1;
      } else {
        ctx.drawImage(info, 0, 0);
      }
      if (i > 0 && k < FLASH_FRAMES) {
        ctx.fillStyle = `rgba(255,255,255,${(200 / 255) * (1 - k / FLASH_FRAMES)})`;
        ctx.fillRect(0, 0, W, H);
      }
    } else {
      const e = f - seg * photos.length;
      ctx.drawImage(end, 0, 0);
      if (e < FLASH_FRAMES + 2) {
        ctx.fillStyle = `rgba(255,255,255,${(230 / 255) * (1 - e / (FLASH_FRAMES + 2))})`;
        ctx.fillRect(0, 0, W, H);
      }
    }
  }

  return { totalFrames, drawFrame };
}

// Formato de grabación: MP4 con H.264 si el navegador lo soporta (Chrome y
// Edge recientes, Safari): es el que acepta todo (TikTok, iPhone, WhatsApp).
// Si no, WebM. Un MP4 sin H.264 (VP9) se deja al final porque muchos celulares
// no lo reproducen.
export function pickRecorderType(): { mimeType: string; ext: "mp4" | "webm" } | null {
  if (typeof MediaRecorder === "undefined") return null;
  const candidates: [string, "mp4" | "webm"][] = [
    ["video/mp4;codecs=avc1.42E01F", "mp4"],
    ["video/mp4;codecs=avc1", "mp4"],
    ["video/webm;codecs=vp9", "webm"],
    ["video/webm;codecs=vp8", "webm"],
    ["video/webm", "webm"],
    ["video/mp4", "mp4"],
  ];
  for (const [mimeType, ext] of candidates) {
    if (MediaRecorder.isTypeSupported(mimeType)) return { mimeType, ext };
  }
  return null;
}

// Graba el video en tiempo real (dura lo mismo que el video). onProgress de 0 a 1.
export async function recordVideo(
  canvas: HTMLCanvasElement,
  plan: VideoPlan,
  onProgress: (fraction: number) => void
): Promise<{ blob: Blob; ext: "mp4" | "webm" }> {
  const type = pickRecorderType();
  if (!type) throw new Error("Este navegador no puede grabar video. Usa Chrome en una computadora.");
  const ctx = canvas.getContext("2d")!;
  plan.drawFrame(ctx, 0);
  const stream = canvas.captureStream(FPS);
  const recorder = new MediaRecorder(stream, {
    mimeType: type.mimeType,
    videoBitsPerSecond: 12_000_000,
  });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };
  const stopped = new Promise<void>((resolve) => {
    recorder.onstop = () => resolve();
  });
  recorder.start(250);
  const start = performance.now();
  await new Promise<void>((resolve) => {
    let last = -1;
    function tick() {
      const frame = Math.floor(((performance.now() - start) / 1000) * FPS);
      if (frame >= plan.totalFrames) {
        resolve();
        return;
      }
      if (frame !== last) {
        plan.drawFrame(ctx, frame);
        last = frame;
        onProgress(frame / plan.totalFrames);
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
  recorder.stop();
  stream.getTracks().forEach((t) => t.stop());
  await stopped;
  onProgress(1);
  return { blob: new Blob(chunks, { type: type.mimeType.split(";")[0] }), ext: type.ext };
}
