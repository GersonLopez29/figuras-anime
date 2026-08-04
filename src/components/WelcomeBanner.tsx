"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type WelcomeBannerProps = {
  name: string;
};

export default function WelcomeBanner({ name }: WelcomeBannerProps) {
  const router = useRouter();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    router.replace("/", { scroll: false });
  }, [router]);

  if (!visible) return null;

  return (
    <div className="border-b border-green-200 bg-green-50">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <p className="text-sm text-green-800">
          🎉 ¡Bienvenido/a, <span className="font-semibold">{name}</span>! Tu cuenta se creó
          con éxito, ya puedes empezar a publicar tus figuras.
        </p>
        <button
          type="button"
          onClick={() => setVisible(false)}
          aria-label="Cerrar mensaje"
          className="shrink-0 text-green-700 hover:text-green-900"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
