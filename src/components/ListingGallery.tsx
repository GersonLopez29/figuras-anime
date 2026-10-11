"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Tilt3D from "@/components/Tilt3D";

type ListingGalleryProps = {
  images: { id: string; url: string }[];
  title: string;
  imageFit?: "cover" | "contain";
};

// Galería tipo vitrina: la foto se inclina en 3D (mouse o giro del celular) y
// se puede arrastrar de lado a lado para "girar" la figura pasando por todas
// sus fotos, como un visor 360°. Las miniaturas siguen funcionando igual.
export default function ListingGallery({ images, title, imageFit = "cover" }: ListingGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  // El aviso "Arrastra para girar" se oculta después del primer giro.
  const [hasDragged, setHasDragged] = useState(false);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ x: number; start: number; step: number; moved: boolean } | null>(null);
  const fitClass = imageFit === "contain" ? "object-contain" : "object-cover";
  const count = images.length;
  const canSpin = count > 1;

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!canSpin || (e.pointerType === "mouse" && e.button !== 0)) return;
    const width = e.currentTarget.getBoundingClientRect().width;
    // Un recorrido de lado a lado alcanza para pasar por todas las fotos.
    const step = Math.max(32, width / (count + 1));
    drag.current = { x: e.clientX, start: activeIndex, step, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d) return;
    const steps = Math.trunc((e.clientX - d.x) / d.step);
    if (steps !== 0) d.moved = true;
    // Arrastrar hacia la izquierda avanza (como pasar fotos con el dedo).
    setActiveIndex((((d.start - steps) % count) + count) % count);
  }

  function endDrag() {
    if (drag.current?.moved) setHasDragged(true);
    drag.current = null;
    setDragging(false);
  }

  return (
    <div>
      <Tilt3D max={6} className="rounded-xl">
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className={`relative aspect-square w-full touch-pan-y select-none overflow-hidden rounded-xl border border-border bg-muted shadow-lg shadow-black/10 dark:shadow-black/40 ${
            canSpin ? (dragging ? "cursor-grabbing" : "cursor-grab") : ""
          }`}
        >
          {count > 0 ? (
            // Todas las fotos apiladas: al girar no hay que esperar a que cargue
            // la siguiente (son 6 como máximo).
            images.map((img, index) => (
              <Image
                key={img.id}
                src={img.url}
                alt={index === activeIndex ? title : ""}
                aria-hidden={index !== activeIndex}
                fill
                draggable={false}
                className={`${fitClass} transition-opacity duration-200 ${
                  index === activeIndex ? "opacity-100" : "opacity-0"
                }`}
                sizes="(min-width: 640px) 50vw, 100vw"
                loading={index === 0 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : "auto"}
              />
            ))
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground/70">
              Sin imagen
            </div>
          )}

          {canSpin && (
            <>
              <span className="absolute right-2 top-2 z-10 rounded-full bg-zinc-900/70 px-2 py-0.5 text-xs font-semibold tabular-nums text-white backdrop-blur-sm">
                {activeIndex + 1}/{count}
              </span>
              {!hasDragged && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-zinc-900/75 px-3 py-1 text-xs font-semibold text-white shadow-lg backdrop-blur-sm motion-safe:animate-pulse"
                >
                  ↔ Arrastra para girar
                </span>
              )}
            </>
          )}
        </div>
      </Tilt3D>
      {/* Sombra en el "piso" de la vitrina: da la sensación de que la foto flota. */}
      <div
        aria-hidden="true"
        className="mx-auto mt-1.5 h-4 w-4/5 rounded-[50%] bg-black/30 blur-md dark:bg-black/70"
      />

      {/* 6 columnas = máximo de fotos: todas las miniaturas en una sola fila. */}
      {canSpin && (
        <div className="mt-2 grid grid-cols-6 gap-2">
          {images.map((img, index) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Ver imagen ${index + 1}`}
              aria-pressed={index === activeIndex}
              className={`relative aspect-square overflow-hidden rounded-lg border-2 bg-zinc-100 transition ${
                index === activeIndex
                  ? "-translate-y-0.5 border-orange-600 shadow-md"
                  : "border-transparent opacity-80 hover:border-input hover:opacity-100"
              }`}
            >
              <Image src={img.url} alt="" fill className={fitClass} sizes="(min-width: 640px) 80px, 16vw" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
