"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CategorySelectProps = {
  listingId: string;
  category: string;
  categories: string[];
};

export default function CategorySelect({ listingId, category, categories }: CategorySelectProps) {
  const router = useRouter();
  const [value, setValue] = useState(category);
  const [loading, setLoading] = useState(false);

  async function handleChange(newCategory: string) {
    const previous = value;
    setValue(newCategory);
    setLoading(true);

    const res = await fetch(`/api/listings/${listingId}/category`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: newCategory }),
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
      <SelectTrigger size="sm" className="text-xs font-medium">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {categories.map((cat) => (
          <SelectItem key={cat} value={cat}>
            {cat}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
