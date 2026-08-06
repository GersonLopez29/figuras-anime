"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const POLL_INTERVAL_MS = 15000;

export default function MessagesNavLink({
  initialCount,
  className,
  onClick,
}: {
  initialCount: number;
  className: string;
  onClick?: () => void;
}) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch("/api/conversations/unread-count");
      if (!res.ok) return;
      const data = await res.json();
      setCount(data.count);
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  return (
    <Link href="/mensajes" onClick={onClick} className={className}>
      Mensajes
      {count > 0 && (
        <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-600 px-1 text-[11px] font-bold text-white">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
