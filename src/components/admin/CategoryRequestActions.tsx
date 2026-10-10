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
        className="rounded-full border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-950/40"
      >
        {loading === "approve" ? "Agregando..." : "Agregar categoría"}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => resolve("reject")}
        disabled={loading !== null}
        className="rounded-full text-muted-foreground hover:border-red-200 dark:hover:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-destructive"
      >
        {loading === "reject" ? "Rechazando..." : "Rechazar"}
      </Button>
    </div>
  );
}
