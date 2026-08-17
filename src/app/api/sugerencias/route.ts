import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { sendSuggestionEmail } from "@/lib/email";

const suggestionSchema = z.object({
  message: z.string().trim().min(5, "Cuéntanos un poco más").max(1000),
  name: z.string().trim().max(100).optional(),
  email: z.string().trim().toLowerCase().email("Correo inválido").optional().or(z.literal("")),
});

const MAX_SUGGESTIONS_PER_IP = 5;
const SUGGESTION_WINDOW_MINUTES = 60;

function getClientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const windowStart = new Date(Date.now() - SUGGESTION_WINDOW_MINUTES * 60_000);

  const recentAttempts = await prisma.suggestionAttempt.count({
    where: { ip, createdAt: { gte: windowStart } },
  });

  if (recentAttempts >= MAX_SUGGESTIONS_PER_IP) {
    return NextResponse.json(
      { error: "Demasiadas sugerencias enviadas desde esta conexión. Intenta de nuevo en un rato." },
      { status: 429 }
    );
  }

  await prisma.suggestionAttempt.create({ data: { ip } });

  const body = await request.json().catch(() => null);
  const parsed = suggestionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { message, name, email } = parsed.data;
  await sendSuggestionEmail(message, name || undefined, email || undefined);

  return NextResponse.json({ ok: true });
}
