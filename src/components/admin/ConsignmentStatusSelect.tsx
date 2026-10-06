"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CONSIGNMENT_STATUSES, getConsignmentStatus } from "@/lib/consignment";

export default function ConsignmentStatusSelect({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [loading, setLoading] = useState(false);

  async function handleChange(next: string) {
    const previous = value;
    setValue(next);
    setLoading(true);
    const res = await fetch(`/api/admin/consignments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setLoading(false);
    if (!res.ok) {
      setValue(previous);
      return;
    }
    router.refresh();
  }

  return (
    <Select value={value} onValueChange={(v) => v && handleChange(v)} disabled={loading}>
      <SelectTrigger size="sm" aria-label="Estado" className="min-w-40 text-xs font-medium">
        <SelectValue>{(v: string) => getConsignmentStatus(v).label}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {CONSIGNMENT_STATUSES.map((s) => (
          <SelectItem key={s.value} value={s.value}>
            {s.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
