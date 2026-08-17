"use client";

import { Button } from "@/components/ui/button";

export default function WhatsAppContactButton({
  listingId,
  whatsappLink,
}: {
  listingId: string;
  whatsappLink: string;
}) {
  function handleClick() {
    fetch(`/api/listings/${listingId}/whatsapp-click`, { method: "POST" }).catch(() => {});
  }

  return (
    <Button
      render={<a href={whatsappLink} target="_blank" rel="noopener noreferrer" onClick={handleClick} />}
      nativeButton={false}
      size="lg"
      className="w-full rounded-full bg-green-600 text-sm font-bold text-white shadow-md shadow-green-600/20 transition hover:-translate-y-0.5 hover:bg-green-700 hover:shadow-lg"
    >
      <span aria-hidden="true">💬</span>
      Contactar por WhatsApp
    </Button>
  );
}
