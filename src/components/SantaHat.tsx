// Gorrito de Papá Noel para la esquina superior derecha de cada figura.
// Decorativo: no es interactivo ni lo lee un lector de pantalla.
export default function SantaHat({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 64 48"
      className={`pointer-events-none absolute -right-2 -top-4 z-10 w-14 rotate-12 drop-shadow-md ${className}`}
    >
      <path d="M8 40 Q 20 30 34 12 Q 42 4 52 8 Q 44 22 58 40 Z" fill="#dc2626" />
      <path d="M8 40 Q 20 30 34 12 Q 30 26 40 40 Z" fill="#b91c1c" opacity="0.35" />
      <circle cx="53" cy="8" r="6" fill="#ffffff" />
      <rect x="4" y="36" width="58" height="11" rx="5.5" fill="#ffffff" />
    </svg>
  );
}
