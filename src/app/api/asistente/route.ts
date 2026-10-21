import { NextResponse, after } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { getClientIp } from "@/lib/requestIp";
import {
  MAX_HISTORY_MESSAGES,
  MAX_QUESTION_CHARS,
  assistantEnabled,
  runAssistant,
} from "@/lib/assistant";

// Límites para que nadie dispare el costo de la API.
const PER_HOUR = 20;
const PER_DAY = 60;
const GLOBAL_PER_DAY = Number(process.env.ASSISTANT_DAILY_LIMIT ?? 300);
const KEEP_DAYS = 90;
const DAY_MS = 24 * 60 * 60 * 1000;

const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(3000),
      })
    )
    .min(1)
    .max(MAX_HISTORY_MESSAGES * 2),
});

const BUSY =
  "Ahora mismo no puedo responder más preguntas. Si es urgente, toca \"Hablar con una persona\" y te atendemos por WhatsApp.";

export async function POST(request: Request) {
  if (!assistantEnabled()) {
    return NextResponse.json({ error: "El asistente no está disponible" }, { status: 503 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Mensaje inválido" }, { status: 400 });
  }
  // Solo las últimas vueltas, empezando por una pregunta y alternando.
  let history = parsed.data.messages.slice(-MAX_HISTORY_MESSAGES);
  while (history.length && history[0].role !== "user") history = history.slice(1);
  const alternates = history.every((m, i) => m.role === (i % 2 === 0 ? "user" : "assistant"));
  const question = history[history.length - 1];
  if (!history.length || !alternates || question.role !== "user") {
    return NextResponse.json({ error: "Mensaje inválido" }, { status: 400 });
  }
  if (question.content.length > MAX_QUESTION_CHARS) {
    return NextResponse.json(
      { error: `Escribe tu pregunta en menos de ${MAX_QUESTION_CHARS} caracteres.` },
      { status: 400 }
    );
  }

  const ip = getClientIp(request);
  const now = Date.now();
  const [lastHour, lastDay, today] = await Promise.all([
    prisma.assistantMessage.count({ where: { ip, createdAt: { gte: new Date(now - 60 * 60 * 1000) } } }),
    prisma.assistantMessage.count({ where: { ip, createdAt: { gte: new Date(now - DAY_MS) } } }),
    prisma.assistantMessage.count({ where: { createdAt: { gte: new Date(now - DAY_MS) } } }),
  ]);
  if (lastHour >= PER_HOUR || lastDay >= PER_DAY || today >= GLOBAL_PER_DAY) {
    return NextResponse.json({ error: BUSY, limited: true }, { status: 429 });
  }

  const user = await getCurrentUser();
  let answer = "";
  let failed = false;
  let result: Awaited<ReturnType<typeof runAssistant>> | null = null;
  try {
    result = await runAssistant(history);
    answer = result.answer;
  } catch (err) {
    console.error("[asistente]", err);
    failed = true;
  }
  if (!answer) {
    failed = true;
    answer =
      "Uy, no pude responder en este momento. Intenta de nuevo en un ratito o toca \"Hablar con una persona\".";
  }

  // El registro va después de responder (no hace esperar a la persona).
  after(async () => {
    try {
      await prisma.assistantMessage.create({
        data: {
          ip,
          userId: user?.id ?? null,
          question: question.content.slice(0, MAX_QUESTION_CHARS),
          answer: answer.slice(0, 4000),
          usedSearch: result?.usedSearch ?? false,
          failed,
          inputTokens: result?.inputTokens ?? 0,
          outputTokens: result?.outputTokens ?? 0,
        },
      });
      // Las conversaciones se guardan como máximo KEEP_DAYS días.
      if (Math.random() < 0.05) {
        await prisma.assistantMessage.deleteMany({
          where: { createdAt: { lt: new Date(Date.now() - KEEP_DAYS * DAY_MS) } },
        });
      }
    } catch (err) {
      console.error("[asistente] no se pudo guardar:", err);
    }
  });

  return NextResponse.json(
    { answer, cards: result?.cards ?? [] },
    { status: failed ? 502 : 200 }
  );
}
