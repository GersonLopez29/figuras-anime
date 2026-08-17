import { NextResponse } from "next/server";
import { z } from "zod";
import { sendSuggestionEmail } from "@/lib/email";

const suggestionSchema = z.object({
  message: z.string().trim().min(5, "Cuéntanos un poco más").max(1000),
  name: z.string().trim().max(100).optional(),
  email: z.string().trim().toLowerCase().email("Correo inválido").optional().or(z.literal("")),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = suggestionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { message, name, email } = parsed.data;
  await sendSuggestionEmail(message, name || undefined, email || undefined);

  return NextResponse.json({ ok: true });
}
