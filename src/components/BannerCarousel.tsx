"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { formatPrice, getFinalPrice } from "@/lib/format";

type BannerSlide = {
  id: string;
  title: string;
  price: number;
  discountAmount: number | null;
  imageUrl: string;
  isOffer: boolean;
  isFeatured?: boolean;
};

const INTERVAL_MS = 5000;

export default function BannerCarousel({ slides }: { slides: BannerSlide[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % slides.length);
    }, INTERVAL_MS);
    return () => clearInterval(interval);
  }, [paused, slides.length]);

  return (
    <div
      className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/5 sm:aspect-[16/11]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((slide, index) => {
        const finalPrice = slide.discountAmount
          ? getFinalPrice(slide.price, slide.discountAmount)
          : slide.price;

        return (
          <Link
            key={slide.id}
            href={`/figura/${slide.id}`}
            aria-hidden={index !== active}
            tabIndex={index === active ? 0 : -1}
            className={`absolute inset-0 transition-opacity duration-700 ${
              index === active ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <Image
              src={slide.imageUrl}
              alt={slide.title}
              fill
              loading={index === 0 ? "eager" : "lazy"}
              fetchPriority={index === 0 ? "high" : "auto"}
              className="object-cover"
              sizes="(min-width: 1024px) 560px, 100vw"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent"
            />
            <div className="absolute inset-y-0 left-0 flex w-[80%] flex-col justify-center gap-2 px-5 sm:w-2/3 sm:px-8">
              <span
                className={`inline-flex w-fit items-center gap-1 rounded-full px-3 py-1 text-xs font-bold shadow-sm ${
                  slide.isFeatured
                    ? "bg-amber-400 text-amber-950"
                    : slide.isOffer
                      ? "bg-green-600 text-white"
                      : "bg-gradient-to-r from-red-600 to-orange-600 text-white"
                }`}
              >
                {slide.isFeatured
                  ? "⭐ Destacada"
                  : slide.isOffer
                    ? "🔥 En oferta"
                    : "🆕 Recién publicada"}
              </span>
              <h3 className="line-clamp-2 text-lg font-extrabold text-white drop-shadow-md sm:text-2xl">
                {slide.title}
              </h3>
              {slide.discountAmount ? (
                <p className="flex items-baseline gap-2">
                  <span className="text-sm text-white/60 line-through">
                    {formatPrice(slide.price)}
                  </span>
                  <span className="text-xl font-bold text-white">
                    {formatPrice(finalPrice)}
                  </span>
                </p>
              ) : (
                <p className="text-xl font-bold text-white">{formatPrice(slide.price)}</p>
              )}
            </div>
          </Link>
        );
      })}

      {slides.length > 1 && (
        <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`Ver banner ${index + 1}`}
              onClick={() => setActive(index)}
              className={`h-1.5 rounded-full transition-all ${
                index === active ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
