"use client";

import { useEffect, useRef, useState, FormEvent } from "react";

type Message = {
  id: string;
  text: string;
  createdAt: string | Date;
  senderId: string;
  sender: { id: string; name: string };
};

type ConversationThreadProps = {
  conversationId: string;
  currentUserId: string;
  initialMessages: Message[];
};

const POLL_INTERVAL_MS = 4000;

export default function ConversationThread({
  conversationId,
  currentUserId,
  initialMessages,
}: ConversationThreadProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef(messages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch(`/api/conversations/${conversationId}/messages`);
      if (!res.ok) return;
      const data: Message[] = await res.json();
      if (data.length !== messagesRef.current.length) {
        setMessages(data);
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const value = text.trim();
    if (!value || sending) return;

    setError(null);
    setSending(true);

    const res = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: value }),
    });

    setSending(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo enviar el mensaje");
      return;
    }

    const message: Message = await res.json();
    setMessages((prev) => [...prev, message]);
    setText("");
  }

  return (
    <div className="mt-4 flex flex-1 flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-zinc-400">
            Envía el primer mensaje para iniciar la conversación.
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === currentUserId;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                    mine
                      ? "bg-orange-600 text-white"
                      : "bg-zinc-100 text-zinc-900"
                  }`}
                >
                  <p className="whitespace-pre-line">{m.text}</p>
                  <p
                    className={`mt-0.5 text-right text-[10px] ${
                      mine ? "text-orange-100" : "text-zinc-400"
                    }`}
                  >
                    {new Date(m.createdAt).toLocaleTimeString("es-PE", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-zinc-100 p-3">
        <input
          type="text"
          required
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="w-full rounded-full border border-zinc-300 px-4 py-2 text-sm focus:border-orange-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={sending}
          className="shrink-0 rounded-full bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
        >
          Enviar
        </button>
      </form>
      {error && <p className="px-3 pb-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
