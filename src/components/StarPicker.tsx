"use client";

import { useState } from "react";

type StarPickerProps = {
  value: number;
  onChange: (value: number) => void;
  size?: "md" | "lg";
};

export default function StarPicker({ value, onChange, size = "md" }: StarPickerProps) {
  const [hoverValue, setHoverValue] = useState(0);
  const starClass = size === "lg" ? "text-3xl" : "text-2xl";

  return (
    <div className={`flex gap-1 ${starClass} text-amber-400`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHoverValue(star)}
          onMouseLeave={() => setHoverValue(0)}
          aria-label={`${star} estrellas`}
        >
          {star <= (hoverValue || value) ? "★" : "☆"}
        </button>
      ))}
    </div>
  );
}
