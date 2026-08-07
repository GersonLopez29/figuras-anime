"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

type Slide = {
  src: string;
  alt: string;
  href: string;
};

const SLIDES: Slide[] = [
  {
    src: "/banners/banner-1.jpg",
    alt: "Okarun Transformed — Luminasta Vol. 2, Dandadan",
    href: "/figura/cmsflkuh2000604laquhof3qa",
  },
  {
    src: "/banners/banner-2.jpg",
    alt: "Son Goku GT — S.H.Figuarts",
    href: "/figura/cmsf6vaj6000804l2x4ajpyqx",
  },
  {
    src: "/banners/banner-3.jpg",
    alt: "Garp Ichiban Kuji Masterlise — One Piece",
    href: "/figura/cmsf9kuny000004lcgeylb34i",
  },
];

const INTERVAL_MS = 5000;

export default function BannerCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % SLIDES.length);
    }, INTERVAL_MS);
    return () => clearInterval(interval);
  }, [paused]);

  return (
    <div
      className="relative mx-auto mt-6 aspect-[16/5] w-full max-w-6xl overflow-hidden rounded-2xl shadow-sm"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {SLIDES.map((slide, index) => (
        <Link
          key={slide.src}
          href={slide.href}
          aria-hidden={index !== active}
          tabIndex={index === active ? 0 : -1}
          className={`absolute inset-0 transition-opacity duration-700 ${
            index === active ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            priority={index === 0}
            className="object-cover"
            sizes="(min-width: 1024px) 1152px, 100vw"
          />
        </Link>
      ))}

      <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
        {SLIDES.map((slide, index) => (
          <button
            key={slide.src}
            type="button"
            aria-label={`Ver banner ${index + 1}`}
            onClick={() => setActive(index)}
            className={`h-1.5 rounded-full transition-all ${
              index === active ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
