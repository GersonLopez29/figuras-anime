import { isNavidadTheme } from "@/lib/seasonal";

// Copos de nieve y luces de navidad. Todo es CSS puro y estático en el
// servidor (sin JavaScript), así no hay diferencias de hidratación. La nieve
// cae una sola vez por carga de página (ver .xmas-snowfall en globals.css).
// Los valores se reparten de forma fija para que cada copo caiga distinto.
const FLAKES = Array.from({ length: 28 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  size: 8 + ((i * 7) % 12),
  duration: 5 + ((i * 5) % 4),
  delay: ((i * 3) % 14) / 5,
  opacity: 0.45 + ((i * 11) % 50) / 100,
}));

export default function SeasonalDecor() {
  if (!isNavidadTheme) return null;

  return (
    <>
      <div aria-hidden="true" className="xmas-lights" />
      <div aria-hidden="true" className="xmas-snowfall pointer-events-none fixed inset-0 z-[9998] overflow-hidden">
        {FLAKES.map((f, i) => (
          <span
            key={i}
            className="xmas-flake"
            style={{
              left: f.left,
              fontSize: `${f.size}px`,
              animationDuration: `${f.duration}s`,
              animationDelay: `${f.delay}s`,
              opacity: f.opacity,
            }}
          >
            ❄
          </span>
        ))}
      </div>
    </>
  );
}
