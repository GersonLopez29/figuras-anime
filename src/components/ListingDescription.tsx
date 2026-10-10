// Descripción de la figura más fácil de leer: si el vendedor escribió una idea
// por línea (lo más común: entregas, condiciones, accesorios), se muestra como
// lista; si escribió párrafos, se respetan los párrafos.

// Viñetas que los vendedores suelen escribir a mano al inicio de la línea.
const BULLET = /^(?:[-*•·▪►➤✓✔✅]|\d{1,2}[.)])\s+/u;
const MAX_LIST_LINE = 140;

export default function ListingDescription({ text }: { text: string }) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return null;

  const isList =
    lines.length >= 3 && lines.every((l) => l.length <= MAX_LIST_LINE);

  return (
    <div className="mt-5">
      <h2 className="text-sm font-semibold text-foreground">Descripción</h2>
      {isList ? (
        <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-foreground/80">
          {lines.map((line, i) => (
            <li key={i} className="flex gap-2.5">
              <span aria-hidden="true" className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
              <span className="min-w-0 break-words">{line.replace(BULLET, "")}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-2 space-y-2.5 text-sm leading-relaxed text-foreground/80">
          {text
            .split(/\r?\n\s*\r?\n/)
            .map((p) => p.trim())
            .filter(Boolean)
            .map((p, i) => (
              <p key={i} className="whitespace-pre-line break-words">
                {p}
              </p>
            ))}
        </div>
      )}
    </div>
  );
}
