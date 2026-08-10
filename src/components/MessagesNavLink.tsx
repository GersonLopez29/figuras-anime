"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

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
        <Badge className="ml-1.5 min-w-5 justify-center px-1 text-[11px]">
          {count > 9 ? "9+" : count}
        </Badge>
      )}
    </Link>
  );
}
