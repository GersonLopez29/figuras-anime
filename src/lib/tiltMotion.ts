// Movimiento 3D de las fotos en pantallas táctiles (solo navegador).
//
// En computadora las tarjetas siguen al mouse (Tilt3D.tsx). En celular y
// tablet no hay mouse, así que hay dos modos, para que el efecto se vea en
// cualquier navegador:
//
// 1. Giroscopio: las tarjetas se inclinan al mover el teléfono. Funciona en
//    Android (Chrome, Samsung Internet, Firefox, Edge, Opera...), que dan el
//    sensor sin pedir permiso.
// 2. Al hacer scroll: si el sensor no responde (iPhone y iPad, donde Safari
//    exige un permiso explícito; o navegadores que bloquean sensores), cada
//    tarjeta se inclina según su posición en la pantalla mientras se desliza
//    la página, como una vitrina curva. No pide ningún permiso.
//
// Ambos escriben variables CSS (--gyro-* en <html>, --scroll-* en cada
// tarjeta) que usa globals.css. Con "reducir movimiento" el efecto es más
// suave en vez de desaparecer.

let started = false;
const elements = new Set<HTMLElement>();
let scrollMode = false;
let scrollFrame = 0;
let intensity = 1;

const MAX_DEG = 8;
// La "posición neutra" sigue despacio a la del celular: si lo sostienes quieto
// en otro ángulo, las tarjetas vuelven a quedar derechas en ~1-2 segundos.
const BASELINE_FOLLOW = 0.015;
// Si en este tiempo el giroscopio no mandó datos, se usa el modo scroll.
const GYRO_WAIT_MS = 1200;
const SCROLL_MAX_RX = 9;
const SCROLL_MAX_RY = 6;

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function isTouchScreen() {
  return window.matchMedia("(pointer: coarse)").matches;
}

// Cada Tilt3D se registra para recibir el efecto de scroll. Devuelve la
// función para darse de baja.
export function registerTiltElement(el: HTMLElement) {
  elements.add(el);
  if (scrollMode) scheduleScrollUpdate();
  return () => {
    elements.delete(el);
  };
}

export function startTiltMotion() {
  if (started || typeof window === "undefined") return;
  started = true;
  if (!isTouchScreen()) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) intensity = 0.6;

  let gotGyro = false;
  startGyro(() => {
    gotGyro = true;
    stopScrollMode();
  });
  window.setTimeout(() => {
    if (!gotGyro) startScrollMode();
  }, GYRO_WAIT_MS);
}

function startGyro(onData: () => void) {
  const DOE = window.DeviceOrientationEvent as
    | (typeof DeviceOrientationEvent & { requestPermission?: () => Promise<string> })
    | undefined;
  // En iPhone/iPad el sensor solo funciona tras un permiso: ahí va el modo scroll.
  if (!DOE || typeof DOE.requestPermission === "function") return;

  const root = document.documentElement;
  let base: { beta: number; gamma: number } | null = null;
  let frame = 0;
  let pending = { rx: 0, ry: 0 };
  let last = { rx: NaN, ry: NaN };

  const apply = () => {
    frame = 0;
    // Redondeado a 0.25°: menos recálculos de estilo, a simple vista igual.
    const rx = Math.round(pending.rx * 4) / 4;
    const ry = Math.round(pending.ry * 4) / 4;
    if (rx === last.rx && ry === last.ry) return;
    last = { rx, ry };
    root.style.setProperty("--gyro-rx", `${rx}deg`);
    root.style.setProperty("--gyro-ry", `${ry}deg`);
    root.style.setProperty("--gyro-gx", `${50 + ry * 5}%`);
    root.style.setProperty("--gyro-gy", `${50 - rx * 5}%`);
  };

  window.addEventListener(
    "deviceorientation",
    (e) => {
      // Computadoras sin sensor mandan un evento con valores vacíos.
      if (e.beta == null || e.gamma == null) return;
      if (!base) {
        base = { beta: e.beta, gamma: e.gamma };
        root.dataset.gyro = "1";
        onData();
      }
      base.beta += (e.beta - base.beta) * BASELINE_FOLLOW;
      base.gamma += (e.gamma - base.gamma) * BASELINE_FOLLOW;
      const max = MAX_DEG * intensity;
      pending = {
        rx: clamp(-(e.beta - base.beta) * 0.5 * intensity, -max, max),
        ry: clamp((e.gamma - base.gamma) * 0.5 * intensity, -max, max),
      };
      if (!frame) frame = requestAnimationFrame(apply);
    },
    { passive: true }
  );
}

function startScrollMode() {
  if (scrollMode) return;
  scrollMode = true;
  document.documentElement.dataset.scrolltilt = "1";
  window.addEventListener("scroll", scheduleScrollUpdate, { passive: true });
  window.addEventListener("resize", scheduleScrollUpdate, { passive: true });
  scheduleScrollUpdate();
}

function stopScrollMode() {
  if (!scrollMode) return;
  scrollMode = false;
  delete document.documentElement.dataset.scrolltilt;
  window.removeEventListener("scroll", scheduleScrollUpdate);
  window.removeEventListener("resize", scheduleScrollUpdate);
  for (const el of elements) {
    for (const p of ["--scroll-rx", "--scroll-ry", "--scroll-gx", "--scroll-gy"]) el.style.removeProperty(p);
  }
}

function scheduleScrollUpdate() {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScrollTilt);
}

function updateScrollTilt() {
  scrollFrame = 0;
  if (!scrollMode) return;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  for (const el of elements) {
    const r = el.getBoundingClientRect();
    if (r.bottom < -50 || r.top > vh + 50) continue; // fuera de pantalla
    // -1 arriba de la pantalla, 0 al centro, 1 abajo (igual a lo ancho).
    const ty = clamp((r.top + r.height / 2 - vh / 2) / (vh / 2), -1, 1);
    const tx = clamp((r.left + r.width / 2 - vw / 2) / (vw / 2), -1, 1);
    const rx = ty * SCROLL_MAX_RX * intensity;
    const ry = -tx * SCROLL_MAX_RY * intensity;
    el.style.setProperty("--scroll-rx", `${rx.toFixed(2)}deg`);
    el.style.setProperty("--scroll-ry", `${ry.toFixed(2)}deg`);
    // El brillo recorre la tarjeta a medida que pasa por la pantalla.
    el.style.setProperty("--scroll-gx", `${(50 - tx * 35).toFixed(1)}%`);
    el.style.setProperty("--scroll-gy", `${(50 - ty * 45).toFixed(1)}%`);
  }
}
