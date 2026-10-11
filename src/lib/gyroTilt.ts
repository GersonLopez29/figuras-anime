// Inclinación 3D con el giro del celular (solo navegador).
//
// Un único listener para toda la página: escribe --gyro-rx / --gyro-ry (y la
// posición del brillo) en <html>, y cada elemento .tilt-3d los usa desde CSS.
// Así 30 tarjetas no ponen 30 listeners.
//
// Solo se activa en pantallas táctiles, sin "reducir movimiento", y en
// navegadores que dan el sensor sin pedir permiso (Android). En iPhone hace
// falta un permiso explícito; ahí las tarjetas quedan quietas, sin preguntar.

let started = false;

const MAX_DEG = 8;
// La "posición neutra" sigue despacio a la del celular: si lo sostienes quieto
// en otro ángulo, las tarjetas vuelven a quedar derechas en ~1-2 segundos.
const BASELINE_FOLLOW = 0.015;

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function startGyroTilt() {
  if (started || typeof window === "undefined") return;
  started = true;

  if (!window.matchMedia("(pointer: coarse)").matches) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const DOE = window.DeviceOrientationEvent as
    | (typeof DeviceOrientationEvent & { requestPermission?: () => Promise<string> })
    | undefined;
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
      if (e.beta == null || e.gamma == null) return;
      if (!base) {
        base = { beta: e.beta, gamma: e.gamma };
        root.dataset.gyro = "1";
      }
      base.beta += (e.beta - base.beta) * BASELINE_FOLLOW;
      base.gamma += (e.gamma - base.gamma) * BASELINE_FOLLOW;
      pending = {
        rx: clamp(-(e.beta - base.beta) * 0.5, -MAX_DEG, MAX_DEG),
        ry: clamp((e.gamma - base.gamma) * 0.5, -MAX_DEG, MAX_DEG),
      };
      if (!frame) frame = requestAnimationFrame(apply);
    },
    { passive: true }
  );
}
