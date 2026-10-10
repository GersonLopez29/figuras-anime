import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

// Se muestra al instante al abrir una figura (desde el catálogo o al terminar
// de publicar) mientras llegan los datos: así no parece que nada pasa.
export default function FiguraLoading() {
  return (
    <div className="mx-auto max-w-5xl scroll-mt-20 px-4 pb-28 pt-8 sm:pb-8" aria-busy="true" aria-live="polite">
      <span className="sr-only">Cargando figura...</span>
      <Skeleton className="h-4 w-32" />
      <div className="mt-4 grid gap-8 sm:grid-cols-2">
        <div>
          <Skeleton className="aspect-square w-full rounded-xl" />
          <div className="mt-3 grid grid-cols-6 gap-2">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        </div>
        <Card className="gap-0 p-5 shadow-sm sm:p-6">
          <div className="flex gap-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="mt-5 h-7 w-4/5" />
          <Skeleton className="mt-2 h-7 w-3/5" />
          <Skeleton className="mt-4 h-9 w-32" />
          <Skeleton className="mt-6 h-11 w-full rounded-full" />
          <Skeleton className="mt-5 h-20 w-full rounded-xl" />
          <div className="mt-5 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </Card>
      </div>
    </div>
  );
}
