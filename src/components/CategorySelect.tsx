"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
    <select
      value={value}
      disabled={loading}
      onChange={(e) => handleChange(e.target.value)}
      className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs font-medium text-zinc-700 focus:border-orange-500 focus:outline-none disabled:opacity-60"
    >
      {categories.map((cat) => (
        <option key={cat} value={cat}>
          {cat}
        </option>
      ))}
    </select>
  );
}
