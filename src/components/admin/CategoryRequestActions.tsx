"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type CategoryRequestActionsProps = {
  requestId: string;
};

export default function CategoryRequestActions({ requestId }: CategoryRequestActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  async function resolve(action: "approve" | "reject") {
    setLoading(action);
    const res = await fetch(`/api/category-requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setLoading(null);

    if (res.ok) {
      router.refresh();
    }
  }

  return (
    <div className="flex gap-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => resolve("approve")}
        disabled={loading !== null}
        className="rounded-full border-green-200 text-green-700 hover:bg-green-50"
      >
        {loading === "approve" ? "Agregando..." : "Agregar categoría"}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => resolve("reject")}
        disabled={loading !== null}
        className="rounded-full text-muted-foreground hover:border-red-200 hover:bg-red-50 hover:text-destructive"
      >
        {loading === "reject" ? "Rechazando..." : "Rechazar"}
      </Button>
    </div>
  );
}
