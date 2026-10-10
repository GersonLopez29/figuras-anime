"use client";

import { useState } from "react";
import Image from "next/image";

type ListingGalleryProps = {
  images: { id: string; url: string }[];
  title: string;
  imageFit?: "cover" | "contain";
};

export default function ListingGallery({ images, title, imageFit = "cover" }: ListingGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex];
  const fitClass = imageFit === "contain" ? "object-contain" : "object-cover";

  return (
    <div>
      <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-border bg-muted shadow-sm">
        {active ? (
          <Image
            src={active.url}
            alt={title}
            fill
            className={fitClass}
            sizes="(min-width: 640px) 50vw, 100vw"
            loading="eager"
            fetchPriority="high"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground/70">
            Sin imagen
          </div>
        )}
      </div>

      {/* 6 columnas = máximo de fotos: todas las miniaturas en una sola fila. */}
      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-6 gap-2">
          {images.map((img, index) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Ver imagen ${index + 1}`}
              className={`relative aspect-square overflow-hidden rounded-lg border-2 bg-zinc-100 transition ${
                index === activeIndex
                  ? "border-orange-600 shadow-sm"
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
