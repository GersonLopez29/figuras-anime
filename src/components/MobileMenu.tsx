"use client";

import { useState } from "react";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import MessagesNavLink from "@/components/MessagesNavLink";

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
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-md text-zinc-700 hover:bg-zinc-100"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          className="h-6 w-6"
        >
          {open ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"
            />
          )}
        </svg>
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30 cursor-default"
          />
          <div className="absolute inset-x-0 top-full z-40 border-b border-zinc-200 bg-white shadow-lg">
            <nav className="flex flex-col px-4 py-2">
              <Link
                href="/comunidad"
                onClick={() => setOpen(false)}
                className="my-1 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-orange-500 px-3.5 py-2 text-sm font-bold text-white shadow-sm"
              >
                <span aria-hidden="true">✨</span>
                Comunidad
              </Link>

              {isLoggedIn ? (
                <>
                  <Link
                    href="/mis-figuras"
                    onClick={() => setOpen(false)}
                    className="rounded-md px-2 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    Mis figuras
                  </Link>
                  <Link
                    href="/favoritos"
                    onClick={() => setOpen(false)}
                    className="rounded-md px-2 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    Favoritos
                  </Link>
                  <MessagesNavLink
                    initialCount={unreadCount}
                    onClick={() => setOpen(false)}
                    className="flex items-center rounded-md px-2 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                  />
                  <Link
                    href="/publicar"
                    onClick={() => setOpen(false)}
                    className="rounded-md px-2 py-2.5 text-sm font-medium text-orange-600 hover:bg-orange-50"
                  >
                    Publicar figura
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setOpen(false)}
                      className="rounded-md px-2 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      Panel admin
                    </Link>
                  )}
                  <div className="my-1 border-t border-zinc-100" />
                  {userName && (
                    <p className="px-2 py-1.5 text-xs text-zinc-400">Hola, {userName}</p>
                  )}
                  <div className="px-2 py-1.5">
                    <LogoutButton />
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="rounded-md px-2 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    Iniciar sesión
                  </Link>
                  <Link
                    href="/registro"
                    onClick={() => setOpen(false)}
                    className="rounded-md px-2 py-2.5 text-sm font-medium text-orange-600 hover:bg-orange-50"
                  >
                    Registrarme
                  </Link>
                </>
              )}
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
