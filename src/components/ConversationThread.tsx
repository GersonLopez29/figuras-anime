"use client";

import { useEffect, useRef, useState, FormEvent } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
    <Card className="mt-4 flex-1 gap-0 overflow-hidden py-0 shadow-sm">
      <div className="flex-1 space-y-2 overflow-y-auto bg-muted/30 p-4">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            Envía el primer mensaje para iniciar la conversación.
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === currentUserId;
            return (
              <div
                key={m.id}
                className={`flex flex-col ${mine ? "items-end" : "items-start"}`}
              >
                <p
                  className={`mb-0.5 px-1 text-[11px] font-medium text-muted-foreground ${
                    mine ? "text-right" : "text-left"
                  }`}
                >
                  {mine ? "Tú" : m.sender.name}
                </p>
                <div
                  className={`max-w-[85%] min-w-0 rounded-2xl px-3.5 py-2 text-sm sm:max-w-[75%] ${
                    mine
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  <p className="whitespace-pre-line break-words">{m.text}</p>
                  <p
                    className={`mt-0.5 text-right text-[10px] ${
                      mine ? "text-primary-foreground/70" : "text-muted-foreground"
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

      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-border p-3">
        <Input
          type="text"
          required
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="rounded-full"
        />
        <Button type="submit" disabled={sending} className="shrink-0 rounded-full">
          Enviar
        </Button>
      </form>
      {error && <p className="px-3 pb-2 text-xs text-destructive">{error}</p>}
    </Card>
  );
}
