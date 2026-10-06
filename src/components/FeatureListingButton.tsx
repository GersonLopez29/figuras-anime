"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { buildWhatsAppLink } from "@/lib/whatsapp";

type FeatureListingButtonProps = {
  listingId: string;
  listingTitle: string;
  price: number;
  days: number;
  // Fecha de vencimiento ya formateada si la figura está destacada ahora.
  featuredUntilLabel: string | null;
  pending: boolean;
  // El admin destaca sus propias figuras sin pagar.
  isAdmin: boolean;
  payment: { name: string; number: string } | null;
};

export default function FeatureListingButton({
  listingId,
  listingTitle,
  price,
  days,
  featuredUntilLabel,
  pending,
  isAdmin,
  payment,
}: FeatureListingButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (pending) {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-200">
        ⏳ Destacado por confirmar
      </span>
    );
  }

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/listings/${listingId}/feature-request`, { method: "POST" });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo enviar la solicitud");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  const proofMessage = `Hola, yapeé S/ ${price} para destacar mi figura "${listingTitle}" en FigurasAnime. Te envío la captura.`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full border-amber-300 text-amber-800 hover:bg-amber-50"
          />
        }
      >
        {featuredUntilLabel ? "⭐ Renovar destacado" : "⭐ Destacar"}
      </DialogTrigger>

      <DialogContent showCloseButton={!loading}>
        <DialogHeader>
          <DialogTitle>⭐ Destaca tu figura</DialogTitle>
          <DialogDescription>
            Durante {days} días tu figura sale primero en el catálogo y en la portada, con la
            etiqueta &quot;Destacada&quot;.
            {featuredUntilLabel && ` Hoy está destacada hasta el ${featuredUntilLabel}; los días se suman.`}
          </DialogDescription>
        </DialogHeader>

        {isAdmin ? (
          <p className="text-sm text-muted-foreground">
            Como administrador, tus figuras se destacan sin pago.
          </p>
        ) : payment ? (
          <ol className="list-decimal space-y-2 pl-5 text-sm text-foreground">
            <li>
              Yapea o plinea <strong>S/ {price}</strong> al{" "}
              <strong className="whitespace-nowrap">{payment.number}</strong> (a nombre de{" "}
              {payment.name}).
            </li>
            <li>
              Envía la captura por{" "}
              <a
                href={buildWhatsAppLink(payment.number, proofMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-green-700 underline"
              >
                WhatsApp
              </a>
              .
            </li>
            <li>
              Toca <strong>Ya pagué</strong>. Apenas confirmemos el pago tu figura se destaca y te
              avisamos por correo.
            </li>
          </ol>
        ) : (
          <p className="text-sm text-destructive">
            Los destacados no están disponibles por ahora. Intenta más tarde.
          </p>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        {(isAdmin || payment) && (
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="w-full rounded-full"
          >
            {loading ? "Enviando..." : isAdmin ? `Destacar ${days} días` : "Ya pagué"}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
