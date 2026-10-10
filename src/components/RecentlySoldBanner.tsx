import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/format";
import { listingPath } from "@/lib/slug";

type SoldItem = {
  id: string;
  slug: string | null;
  title: string;
  price: number;
  imageUrl?: string;
};

export default function RecentlySoldBanner({ items }: { items: SoldItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="border-b border-border bg-muted/40">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5">
        <span className="flex shrink-0 items-center gap-1.5 text-xs font-bold text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-600" />
          </span>
          Vendidas hace poco
        </span>
        <div className="no-scrollbar flex gap-2 overflow-x-auto py-0.5">
          {items.map((item) => (
            <Link
              key={item.id}
              href={listingPath(item)}
              className="flex shrink-0 items-center gap-2 rounded-full bg-card py-1 pr-3 pl-1 text-xs shadow-sm ring-1 ring-border transition hover:-translate-y-0.5 hover:shadow-md"
            >
              {item.imageUrl && (
                <Image
                  src={item.imageUrl}
                  alt=""
                  width={24}
                  height={24}
                  className="h-6 w-6 shrink-0 rounded-full object-cover"
                />
              )}
              <span className="max-w-[9rem] truncate font-medium text-foreground">
                {item.title}
              </span>
              <span className="shrink-0 font-bold text-green-700 dark:text-green-300">
                {formatPrice(item.price)}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
