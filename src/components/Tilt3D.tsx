"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { registerTiltElement, startTiltMotion } from "@/lib/tiltMotion";

type Tilt3DProps = {
  children: ReactNode;
  className?: string;
  // Grados máximos de inclinación con el mouse o el dedo.
  max?: number;
  // Brillo holográfico que sigue al mouse.
  glare?: boolean;
};

const TILT_PROPS = ["--tilt-rx", "--tilt-ry", "--tilt-gx", "--tilt-gy"];

// Inclina su contenido en 3D hacia donde está el mouse (o el dedo al tocar),
// con un brillo tipo carta holográfica. En celular, además, se mueve con el
// giro del teléfono o al hacer scroll (ver tiltMotion.ts).
// Los estilos están en globals.css (.tilt-3d y .tilt-glare).
//
// Usa solo Pointer Events y variables CSS, que funcionan igual en Chrome,
// Edge, Firefox, Safari (Mac, iPhone, iPad), Opera, Brave y Samsung Internet.
export default function Tilt3D({ children, className = "", max = 10, glare = true }: Tilt3DProps) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const reduced = useRef(false);
  // Dedo apoyado sobre la tarjeta (en pantallas táctiles).
  const pressed = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    startTiltMotion();
    const el = ref.current;
    const unregister = el ? registerTiltElement(el) : undefined;
    return () => {
      cancelAnimationFrame(frame.current);
      unregister?.();
    };
  }, []);

  function tiltToward(clientX: number, clientY: number) {
    const el = ref.current;
    if (!el) return;
    // Con "reducir movimiento" (en Windows basta con tener las animaciones
    // del sistema apagadas) el efecto sigue, pero más suave.
    const tilt = reduced.current ? max * 0.6 : max;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      const px = clamp01((clientX - r.left) / r.width);
      const py = clamp01((clientY - r.top) / r.height);
      el.style.setProperty("--tilt-rx", `${((0.5 - py) * tilt * 2).toFixed(2)}deg`);
      el.style.setProperty("--tilt-ry", `${((px - 0.5) * tilt * 2).toFixed(2)}deg`);
      el.style.setProperty("--tilt-gx", `${(px * 100).toFixed(1)}%`);
      el.style.setProperty("--tilt-gy", `${(py * 100).toFixed(1)}%`);
      el.dataset.tilting = "1";
    });
  }

  function reset() {
    const el = ref.current;
    pressed.current = false;
    if (!el) return;
    cancelAnimationFrame(frame.current);
    for (const p of TILT_PROPS) el.style.removeProperty(p);
    delete el.dataset.tilting;
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType === "mouse") return;
    pressed.current = true;
    tiltToward(e.clientX, e.clientY);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse" && !pressed.current) return;
    tiltToward(e.clientX, e.clientY);
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse") reset();
  }

  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      // Al empezar a hacer scroll con el dedo, el navegador cancela el toque.
      onPointerCancel={reset}
      onPointerLeave={reset}
      className={`tilt-3d relative ${className}`}
    >
      {children}
      {glare && <div aria-hidden="true" className="tilt-glare" />}
    </div>
  );
}

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}
