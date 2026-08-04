"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

type Sparkle = {
  id: number;
  x: number;
  y: number;
  emoji: string;
  rotation: number;
};

const EMOJIS = ["✨", "⭐", "🌟", "💫"];
const MIN_DISTANCE = 28;
const LIFETIME_MS = 700;

export default function CursorTrail() {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const nextIdRef = useRef(0);

  useEffect(() => {
    const canHover = window.matchMedia("(pointer: fine)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!canHover || reducedMotion) return;

    function handleMouseMove(e: MouseEvent) {
      const last = lastPointRef.current;
      if (last) {
        const dx = e.clientX - last.x;
        const dy = e.clientY - last.y;
        if (dx * dx + dy * dy < MIN_DISTANCE * MIN_DISTANCE) return;
      }
      lastPointRef.current = { x: e.clientX, y: e.clientY };

      const id = nextIdRef.current++;
      const sparkle: Sparkle = {
        id,
        x: e.clientX,
        y: e.clientY,
        emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
        rotation: Math.random() * 40 - 20,
      };

      setSparkles((prev) => [...prev, sparkle]);
      setTimeout(() => {
        setSparkles((prev) => prev.filter((s) => s.id !== id));
      }, LIFETIME_MS);
    }

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  if (sparkles.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
      {sparkles.map((s) => (
        <span
          key={s.id}
          className="absolute select-none animate-sparkle-fade text-lg"
          style={
            {
              left: s.x,
              top: s.y,
              "--sparkle-rotation": `${s.rotation}deg`,
            } as CSSProperties
          }
        >
          {s.emoji}
        </span>
      ))}
    </div>
  );
}
