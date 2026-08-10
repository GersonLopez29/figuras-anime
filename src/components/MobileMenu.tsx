"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import LogoutButton from "@/components/LogoutButton";
import MessagesNavLink from "@/components/MessagesNavLink";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type MobileMenuProps = {
  isLoggedIn: boolean;
  userName?: string;
  isAdmin: boolean;
  unreadCount: number;
};

export default function MobileMenu({ isLoggedIn, userName, isAdmin, unreadCount }: MobileMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
        className="rounded-full"
      >
        <Menu className="h-6 w-6" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle className="sr-only">Menú</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-0.5 px-3">
            <Badge
              render={<Link href="/comunidad" onClick={() => setOpen(false)} />}
              className="mb-1 h-auto gap-1.5 bg-gradient-to-r from-fuchsia-500 to-orange-500 px-3.5 py-2.5 text-sm font-bold text-white shadow-sm"
            >
              <span aria-hidden="true">✨</span>
              Comunidad
            </Badge>

            {isLoggedIn ? (
              <>
                <Link
                  href="/mis-figuras"
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-foreground/80 transition hover:bg-muted"
                >
                  Mis figuras
                </Link>
                <Link
                  href="/favoritos"
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-foreground/80 transition hover:bg-muted"
                >
                  Favoritos
                </Link>
                <MessagesNavLink
                  initialCount={unreadCount}
                  onClick={() => setOpen(false)}
                  className="flex items-center rounded-xl px-3 py-2.5 text-sm font-medium text-foreground/80 transition hover:bg-muted"
                />
                <Link
                  href="/publicar"
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-primary transition hover:bg-primary/5"
                >
                  Publicar figura
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setOpen(false)}
                    className="rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
                  >
                    Panel admin
                  </Link>
                )}
                <div className="mt-1 flex items-center justify-between rounded-xl bg-muted px-3 py-2">
                  {userName && (
                    <p className="text-xs text-muted-foreground">Hola, {userName}</p>
                  )}
                  <LogoutButton />
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-foreground/80 transition hover:bg-muted"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/registro"
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-primary transition hover:bg-primary/5"
                >
                  Registrarme
                </Link>
              </>
            )}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
