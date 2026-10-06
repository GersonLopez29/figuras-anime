"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function FeatureRequestActions({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function resolve(action: "approve" | "reject") {
    setLoading(action);
    setError(null);
    const res = await fetch(`/api/admin/feature-requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setLoading(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo actualizar");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          onClick={() => resolve("approve")}
          disabled={loading !== null}
          className="rounded-full bg-green-600 text-white hover:bg-green-700"
        >
          {loading === "approve" ? "Aprobando..." : "Pago recibido"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => resolve("reject")}
          disabled={loading !== null}
          className="rounded-full"
        >
          {loading === "reject" ? "Rechazando..." : "Rechazar"}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
