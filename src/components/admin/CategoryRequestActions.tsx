"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
      <button
        type="button"
        onClick={() => resolve("approve")}
        disabled={loading !== null}
        className="rounded-full border border-green-200 px-3 py-1.5 text-sm font-medium text-green-700 transition hover:bg-green-50 disabled:opacity-60"
      >
        {loading === "approve" ? "Agregando..." : "Agregar categoría"}
      </button>
      <button
        type="button"
        onClick={() => resolve("reject")}
        disabled={loading !== null}
        className="rounded-full border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
      >
        {loading === "reject" ? "Rechazando..." : "Rechazar"}
      </button>
    </div>
  );
}
