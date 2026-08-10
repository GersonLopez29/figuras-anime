"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

type WelcomeBannerProps = {
  name: string;
};

const AUTO_DISMISS_MS = 45_000;

export default function WelcomeBanner({ name }: WelcomeBannerProps) {
  const router = useRouter();
  const [visible, setVisible] = useState(true);

  function dismiss() {
    setVisible(false);
    router.replace("/", { scroll: false });
  }

  useEffect(() => {
    const timer = setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!visible) return null;

  return (
    <div className="border-b border-green-200 bg-green-50">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <p className="text-sm text-green-800">
          🎉 ¡Bienvenido/a, <span className="font-semibold">{name}</span>! Tu cuenta se creó
          con éxito, ya puedes empezar a publicar tus figuras.
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={dismiss}
          aria-label="Cerrar mensaje"
          className="shrink-0 text-green-700 hover:bg-green-100 hover:text-green-900"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
