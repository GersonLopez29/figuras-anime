"use client";

import { useState } from "react";
import Image from "next/image";

type ListingGalleryProps = {
  images: { id: string; url: string }[];
  title: string;
};

export default function ListingGallery({ images, title }: ListingGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex];

  return (
    <div>
      <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100">
        {active ? (
          <Image
            src={active.url}
            alt={title}
            fill
            className="object-cover"
            sizes="(min-width: 640px) 50vw, 100vw"
            priority
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-zinc-400">
            Sin imagen
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {images.map((img, index) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`relative aspect-square overflow-hidden rounded-md border-2 transition ${
                index === activeIndex
                  ? "border-orange-600"
                  : "border-transparent hover:border-zinc-300"
              }`}
            >
              <Image src={img.url} alt="" fill className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
