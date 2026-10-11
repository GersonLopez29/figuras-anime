"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { startGyroTilt } from "@/lib/gyroTilt";

type Tilt3DProps = {
  children: ReactNode;
  className?: string;
  // Grados máximos de inclinación con el mouse.
  max?: number;
  // Brillo holográfico que sigue al mouse.
  glare?: boolean;
};

// Inclina su contenido en 3D hacia donde está el mouse, con un brillo tipo
// carta holográfica. En celular usa el giro del teléfono (ver gyroTilt.ts).
// Los estilos están en globals.css (.tilt-3d y .tilt-glare).
export default function Tilt3D({ children, className = "", max = 10, glare = true }: Tilt3DProps) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    startGyroTilt();
    return () => cancelAnimationFrame(frame.current);
  }, []);

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    const { clientX, clientY } = e;
    // Con "reducir movimiento" (en Windows basta con tener las animaciones
    // del sistema apagadas) el efecto sigue, pero más suave: solo se mueve
    // cuando la persona mueve el mouse encima, nunca solo.
    const tilt = reduced.current ? max * 0.6 : max;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const r = el.getBoundingClientRect();
      const px = clamp01((clientX - r.left) / r.width);
      const py = clamp01((clientY - r.top) / r.height);
      el.style.setProperty("--tilt-rx", `${((0.5 - py) * tilt * 2).toFixed(2)}deg`);
      el.style.setProperty("--tilt-ry", `${((px - 0.5) * tilt * 2).toFixed(2)}deg`);
      el.style.setProperty("--tilt-gx", `${(px * 100).toFixed(1)}%`);
      el.style.setProperty("--tilt-gy", `${(py * 100).toFixed(1)}%`);
      el.dataset.tilting = "1";
    });
  }

  function onPointerLeave() {
    const el = ref.current;
    if (!el) return;
    cancelAnimationFrame(frame.current);
    for (const p of ["--tilt-rx", "--tilt-ry", "--tilt-gx", "--tilt-gy"]) el.style.removeProperty(p);
    delete el.dataset.tilting;
  }

  return (
    <div
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
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
