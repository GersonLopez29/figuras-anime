"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Bot, Lightbulb, MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SuggestionDialog } from "@/components/SuggestionButton";
import { buildWhatsAppLink } from "@/lib/whatsapp";

// Chat del asistente (botón flotante abajo a la derecha). La conversación se
// guarda en sessionStorage para que siga al cambiar de página en la misma
// pestaña; se borra al cerrar la pestaña.

type Card = {
  id: string;
  title: string;
  price: string;
  oldPrice: string | null;
  path: string;
  imageUrl: string | null;
  note: string | null;
};
type Msg = { role: "user" | "assistant"; content: string; cards?: Card[]; error?: boolean };

const STORAGE_KEY = "gerstore-asistente";
// Se abre solo una vez por visita (pestaña): si la persona lo cierra, no
// vuelve a aparecer mientras navega.
const AUTO_KEY = "gerstore-asistente-auto";
const AUTO_DELAY_MS = 4000;
const TEASER_MS = 15000;
const MAX_CHARS = 500;
const QUICK_QUESTIONS = [
  "¿Cómo publico una figura?",
  "Busco figuras de Dragon Ball",
  "¿Cómo sé si una figura es original?",
  "¿Cómo funciona destacar?",
];
const GREETING =
  "¡Hola! Soy el asistente de GerStore 🤖. Puedo buscar figuras en el catálogo y resolver tus dudas sobre cómo comprar o vender. ¿En qué te ayudo?";

function loadMessages(): Msg[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Msg[]) : [];
    return Array.isArray(parsed) ? parsed.slice(-30) : [];
  } catch {
    return [];
  }
}

function safeHref(href: string): { href: string; internal: boolean } | null {
  if (href.startsWith("/") && !href.startsWith("//")) return { href, internal: true };
  const site = href.match(/^https:\/\/(www\.)?gerstore\.club(\/.*)?$/);
  if (site) return { href: site[2] || "/", internal: true };
  if (href.startsWith("https://wa.me/")) return { href, internal: false };
  return null;
}

// Texto con [enlaces](/ruta) y **negritas**. Solo se aceptan enlaces de la
// propia página o de WhatsApp; no se usa HTML crudo.
function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1]) {
      const link = safeHref(m[2]);
      if (!link) out.push(m[1]);
      else if (link.internal)
        out.push(
          <Link key={`${keyBase}-${i++}`} href={link.href} className="font-medium text-primary underline underline-offset-2">
            {m[1]}
          </Link>
        );
      else
        out.push(
          <a key={`${keyBase}-${i++}`} href={link.href} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline underline-offset-2">
            {m[1]}
          </a>
        );
    } else if (m[3]) {
      out.push(<strong key={`${keyBase}-${i++}`}>{m[3]}</strong>);
    }
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function RichText({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  let bullets: string[] = [];
  const flush = (k: number) => {
    if (bullets.length) {
      blocks.push(
        <ul key={`ul-${k}`} className="list-disc space-y-0.5 pl-4">
          {bullets.map((b, j) => (
            <li key={j}>{inline(b, `b-${k}-${j}`)}</li>
          ))}
        </ul>
      );
      bullets = [];
    }
  };
  text.split("\n").forEach((line, k) => {
    const t = line.trim();
    const bullet = t.match(/^(?:[-•*]|\d+[.)])\s+(.*)$/);
    if (bullet) {
      bullets.push(bullet[1]);
      return;
    }
    flush(k);
    if (!t) return;
    const heading = t.match(/^#{1,4}\s+(.*)$/);
    blocks.push(
      <p key={`p-${k}`} className={heading ? "font-semibold" : undefined}>
        {inline(heading ? heading[1] : t, `p-${k}`)}
      </p>
    );
  });
  flush(-1);
  return <div className="space-y-1.5">{blocks}</div>;
}

function CardsRow({ cards }: { cards: Card[] }) {
  return (
    <div className="no-scrollbar -mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1">
      {cards.map((c) => (
        <Link
          key={c.id}
          href={c.path}
          className="flex w-36 shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-card text-left shadow-xs transition hover:border-primary/50"
        >
          <span className="relative block aspect-square w-full bg-muted">
            {c.imageUrl && <Image src={c.imageUrl} alt="" fill sizes="144px" className="object-cover" />}
          </span>
          <span className="flex flex-1 flex-col gap-0.5 p-2">
            <span className="line-clamp-2 text-xs font-medium text-foreground">{c.title}</span>
            <span className="mt-auto text-sm font-bold text-primary">
              {c.price}
              {c.oldPrice && (
                <span className="ml-1 text-xs font-normal text-muted-foreground line-through">{c.oldPrice}</span>
              )}
            </span>
            {c.note && <span className="text-[11px] text-muted-foreground">{c.note}</span>}
          </span>
        </Link>
      ))}
    </div>
  );
}

export default function AssistantWidget({ contactNumber }: { contactNumber: string | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>(loadMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  // Burbuja de saludo junto al botón (en celular, en vez de abrir el chat).
  const [teaser, setTeaser] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // Solo se enfoca el campo de texto si la persona abrió el chat: al abrirse
  // solo no debe robar el foco ni sacar el teclado del celular.
  const focusOnOpen = useRef(false);
  const isAdmin = pathname.startsWith("/admin");

  // A los pocos segundos de entrar: en computadora se abre el chat; en celular
  // aparece la burbuja (el chat taparía casi toda la pantalla, y Google
  // penaliza las ventanas que tapan el contenido en celular al cargar).
  useEffect(() => {
    if (isAdmin) return;
    try {
      if (window.sessionStorage.getItem(AUTO_KEY)) return;
    } catch {
      return;
    }
    const timer = window.setTimeout(() => {
      try {
        window.sessionStorage.setItem(AUTO_KEY, "1");
      } catch {
        // sin almacenamiento: igual se muestra esta vez
      }
      if (window.matchMedia("(min-width: 640px)").matches) setOpen(true);
      else setTeaser(true);
    }, AUTO_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [isAdmin]);

  useEffect(() => {
    if (!teaser) return;
    const timer = window.setTimeout(() => setTeaser(false), TEASER_MS);
    return () => window.clearTimeout(timer);
  }, [teaser]);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)));
    } catch {
      // Navegación privada o almacenamiento lleno: la conversación no se guarda.
    }
  }, [messages]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open]);

  useEffect(() => {
    if (open && focusOnOpen.current) inputRef.current?.focus();
    focusOnOpen.current = false;
  }, [open]);

  // En el panel de administrador no hace falta.
  if (isAdmin) return null;

  function openByUser() {
    focusOnOpen.current = true;
    setTeaser(false);
    setOpen(true);
  }

  async function ask(text: string) {
    const question = text.trim().slice(0, MAX_CHARS);
    if (!question || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: question }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      // Solo las vueltas válidas (sin errores), alternando pregunta/respuesta.
      const history = next
        .filter((m) => !m.error)
        .map((m) => ({ role: m.role, content: m.content }))
        .filter((m, i, arr) => i === 0 || m.role !== arr[i - 1].role);
      const res = await fetch("/api/asistente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.answer) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.answer, cards: data.cards ?? [], error: !res.ok }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.error ?? "No pude responder ahora. Intenta de nuevo en un rato.", error: true },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Parece que no hay conexión. Revisa tu internet e intenta de nuevo.", error: true },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    ask(input);
  }

  const whatsappHref = contactNumber
    ? buildWhatsAppLink(contactNumber, "Hola GerStore, tengo una consulta: ")
    : "/contacto";

  return (
    <>
      {!open && teaser && (
        <div className="assistant-teaser fixed bottom-[4.5rem] right-4 z-40 w-64 rounded-2xl rounded-br-sm border border-border bg-background p-3 pr-8 text-sm shadow-xl sm:bottom-[4.75rem] sm:right-5">
          <button type="button" onClick={openByUser} className="text-left text-foreground">
            <span className="font-semibold">👋 ¡Hola! ¿Tienes dudas?</span>
            <span className="mt-0.5 block text-muted-foreground">
              Te ayudo a encontrar figuras o a vender la tuya. Toca aquí para preguntarme.
            </span>
          </button>
          <button
            type="button"
            onClick={() => setTeaser(false)}
            aria-label="Cerrar el saludo"
            className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {!open && (
        <Button
          onClick={openByUser}
          aria-label="Abrir el asistente de GerStore"
          className="suggestion-fab fixed bottom-4 right-4 z-40 h-12 gap-2 rounded-full px-4 shadow-lg shadow-orange-600/25 sm:bottom-5 sm:right-5"
        >
          <MessageCircle className="size-5" />
          <span className="text-sm font-semibold">¿Dudas?</span>
        </Button>
      )}

      {open && (
        <div
          role="dialog"
          aria-label="Asistente de GerStore"
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          className="fixed inset-x-2 bottom-2 z-50 flex h-[min(85dvh,38rem)] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-[24rem]"
        >
          <div className="flex items-center gap-3 border-b border-border bg-gradient-to-r from-orange-600 to-amber-500 px-4 py-3 text-white">
            <span className="flex size-9 items-center justify-center rounded-full bg-white/20">
              <Bot className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-tight">Asistente GerStore</p>
              <p className="text-xs text-white/85">Te responde al toque · con IA</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar el asistente"
              className="rounded-full p-1.5 transition hover:bg-white/20"
            >
              <X className="size-5" />
            </button>
          </div>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-4 text-sm">
            <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-muted px-3 py-2 text-foreground">{GREETING}</div>
            {messages.length === 0 && (
              <div className="flex flex-wrap gap-2">
                {QUICK_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => ask(q)}
                    className="rounded-full border border-primary/40 bg-primary/5 px-3 py-1.5 text-left text-xs font-medium text-primary transition hover:bg-primary/10"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
            {messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="ml-auto max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-primary px-3 py-2 text-primary-foreground">
                  {m.content}
                </div>
              ) : (
                <div key={i} className="max-w-[95%]">
                  <div
                    className={`rounded-2xl rounded-tl-sm px-3 py-2 ${
                      m.error ? "bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200" : "bg-muted text-foreground"
                    }`}
                  >
                    <RichText text={m.content} />
                  </div>
                  {m.cards && m.cards.length > 0 && <CardsRow cards={m.cards} />}
                </div>
              )
            )}
            {loading && (
              <div className="flex w-16 items-center justify-center gap-1 rounded-2xl rounded-tl-sm bg-muted px-3 py-3" aria-label="Escribiendo">
                {[0, 150, 300].map((d) => (
                  <span key={d} className="size-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-border px-3 pb-3 pt-2">
            <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
              <a
                href={whatsappHref}
                target={contactNumber ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="font-medium text-green-700 hover:underline dark:text-green-400"
              >
                💬 Hablar con una persona
              </a>
              <button type="button" onClick={() => setSuggestOpen(true)} className="inline-flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground">
                <Lightbulb className="size-3.5" aria-hidden="true" /> Enviar una sugerencia
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    ask(input);
                  }
                }}
                rows={1}
                placeholder="Escribe tu pregunta…"
                aria-label="Tu pregunta"
                className="max-h-28 min-h-10 flex-1 resize-none rounded-2xl border border-input bg-background px-3 py-2 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:text-sm"
              />
              <Button type="submit" size="icon" disabled={loading || !input.trim()} aria-label="Enviar pregunta" className="size-10 shrink-0 rounded-full">
                <Send className="size-4" />
              </Button>
            </form>
            <p className="mt-1.5 text-center text-[11px] text-muted-foreground">
              Respuestas generadas con IA: pueden tener errores. Confirma los detalles con el vendedor.
            </p>
          </div>
        </div>
      )}

      <SuggestionDialog open={suggestOpen} onOpenChange={setSuggestOpen} />
    </>
  );
}
