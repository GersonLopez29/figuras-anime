// Asistente de la página: responde dudas sobre GerStore y busca figuras en el
// catálogo real. Usa la API de Claude (Anthropic) con una herramienta,
// buscar_figuras, para no inventar stock ni precios.
//
// Requiere ANTHROPIC_API_KEY en Vercel. Sin la clave, el botón del chat no se
// muestra y queda el de "Sugerencias" como antes.

import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db";
import { getCategoryNames } from "@/lib/categories";
import { getActiveDiscountAmount, getFinalPrice } from "@/lib/format";
import { getConditionLabel } from "@/lib/condition";
import { getDeliveryZoneLabel, isDeliveryZone } from "@/lib/delivery";
import { getActiveReservation } from "@/lib/reservation";
import { PRODUCT_LINES, productLineWhere, type ProductLineSlug } from "@/lib/catalog";
import { listingPath } from "@/lib/slug";
import { prettyListingTitle } from "@/lib/listingSeo";
import { assistantDynamicPrompt, assistantStaticPrompt } from "@/lib/assistantKnowledge";
import type { Prisma } from "@/generated/prisma/client";

export const ASSISTANT_MODEL = process.env.ASSISTANT_MODEL ?? "claude-haiku-4-5-20251001";
// Precio de Claude Haiku 4.5 (US$ por millón de tokens), para estimar el costo
// en el panel admin: https://platform.claude.com/docs/en/about-claude/pricing
export const PRICE_PER_MTOK = { input: 1, output: 5 };

export const MAX_QUESTION_CHARS = 500;
export const MAX_HISTORY_MESSAGES = 12;
const MAX_OUTPUT_TOKENS = 700;
const MAX_TOOL_ROUNDS = 3;
const SEARCH_LIMIT = 6;

export function assistantEnabled(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

export type ChatTurn = { role: "user" | "assistant"; content: string };

// Tarjeta de figura que el chat muestra debajo de la respuesta.
export type AssistantCard = {
  id: string;
  title: string;
  price: string;
  oldPrice: string | null;
  path: string;
  imageUrl: string | null;
  note: string | null;
};

export type AssistantResult = {
  answer: string;
  cards: AssistantCard[];
  usedSearch: boolean;
  inputTokens: number;
  outputTokens: number;
};

const SEARCH_TOOL: Anthropic.Tool = {
  name: "buscar_figuras",
  description:
    "Busca figuras DISPONIBLES (no vendidas) en el catálogo de GerStore. Úsala siempre que pregunten qué hay, precios, stock, recomendaciones o una figura en particular. Devuelve hasta 6 figuras con precio, estado, zonas de entrega y la ruta de su página. Combina filtros si hace falta; para algo general (ej. 'figuras baratas') puedes omitir texto.",
  input_schema: {
    type: "object",
    properties: {
      texto: {
        type: "string",
        description: "Personaje, serie o modelo a buscar en el título, ej. 'goku ssj4', 'luffy', 'tanjiro'. Sin palabras como 'figura' o 'quiero'.",
      },
      categoria: {
        type: "string",
        description: "Nombre exacto de una categoría del catálogo (ej. 'Dragon Ball Z', 'Naruto').",
      },
      linea: {
        type: "string",
        enum: PRODUCT_LINES.map((l) => l.slug),
        description: `Línea de producto: ${PRODUCT_LINES.map((l) => `${l.slug} = ${l.label}`).join(", ")}.`,
      },
      precio_max: { type: "number", description: "Precio máximo en soles." },
      precio_min: { type: "number", description: "Precio mínimo en soles." },
      solo_ofertas: { type: "boolean", description: "Solo figuras con descuento activo." },
      orden: {
        type: "string",
        enum: ["recientes", "mas_baratas", "mas_caras"],
        description: "Orden de los resultados (por defecto, recientes).",
      },
    },
  },
};

type SearchInput = {
  texto?: string;
  categoria?: string;
  linea?: string;
  precio_max?: number;
  precio_min?: number;
  solo_ofertas?: boolean;
  orden?: "recientes" | "mas_baratas" | "mas_caras";
};

const STOP_WORDS = new Set([
  "figura", "figuras", "de", "del", "la", "el", "los", "las", "un", "una", "y", "en", "con", "para",
  "quiero", "busco", "hay", "tienen", "tienes", "original", "originales", "anime",
]);

function soles(n: number): string {
  return `S/ ${Number.isInteger(n) ? n : n.toFixed(2)}`;
}

async function searchListings(input: SearchInput, categories: string[]) {
  const now = new Date();
  const words = (input.texto ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9.]+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w))
    .slice(0, 6);

  const category = input.categoria
    ? categories.find((c) => c.toLowerCase() === input.categoria!.trim().toLowerCase())
    : undefined;
  const line = PRODUCT_LINES.find((l) => l.slug === input.linea)?.slug as ProductLineSlug | undefined;

  const base: Prisma.ListingWhereInput = {
    sold: false,
    user: { isBlocked: false },
    ...(category ? { category } : {}),
    ...(input.precio_max !== undefined || input.precio_min !== undefined
      ? {
          price: {
            ...(input.precio_min !== undefined ? { gte: input.precio_min } : {}),
            ...(input.precio_max !== undefined ? { lte: input.precio_max } : {}),
          },
        }
      : {}),
    ...(input.solo_ofertas ? { discountAmount: { not: null }, discountExpiresAt: { gt: now } } : {}),
    ...(line ? { AND: [productLineWhere(line)!] } : {}),
  };
  const wordFilter = (mode: "AND" | "OR"): Prisma.ListingWhereInput =>
    words.length === 0
      ? {}
      : {
          [mode]: words.map((w) => ({
            OR: [
              { title: { contains: w, mode: "insensitive" as const } },
              { category: { contains: w, mode: "insensitive" as const } },
            ],
          })),
        };
  const orderBy: Prisma.ListingOrderByWithRelationInput[] =
    input.orden === "mas_baratas"
      ? [{ price: "asc" }]
      : input.orden === "mas_caras"
        ? [{ price: "desc" }]
        : [{ createdAt: "desc" }];
  const select = {
    id: true,
    slug: true,
    title: true,
    price: true,
    discountAmount: true,
    discountExpiresAt: true,
    category: true,
    condition: true,
    deliveryZones: true,
    isPreorder: true,
    reservedAmount: true,
    reservedUntil: true,
    acceptsOffers: true,
    photoType: true,
    images: { select: { url: true }, take: 1 },
    user: { select: { name: true } },
  } satisfies Prisma.ListingSelect;

  // Primero todas las palabras; si no hay nada, cualquiera de ellas.
  let where: Prisma.ListingWhereInput = { AND: [base, wordFilter("AND")] };
  let [listings, total] = await Promise.all([
    prisma.listing.findMany({ where, orderBy, take: SEARCH_LIMIT, select }),
    prisma.listing.count({ where }),
  ]);
  let partial = false;
  if (total === 0 && words.length > 1) {
    where = { AND: [base, wordFilter("OR")] };
    [listings, total] = await Promise.all([
      prisma.listing.findMany({ where, orderBy, take: SEARCH_LIMIT, select }),
      prisma.listing.count({ where }),
    ]);
    partial = total > 0;
  }

  const items = listings.map((l) => {
    const discount = getActiveDiscountAmount(l.discountAmount, l.discountExpiresAt);
    const finalPrice = discount ? getFinalPrice(l.price, discount) : l.price;
    const reserved = !!getActiveReservation(l.reservedAmount, l.reservedUntil);
    const zones = l.deliveryZones.filter(isDeliveryZone).map((z) => getDeliveryZoneLabel(z));
    const notes = [
      discount ? `oferta (antes ${soles(l.price)})` : null,
      l.isPreorder ? "preventa" : null,
      reserved ? "separada" : null,
    ].filter(Boolean);
    return {
      card: {
        id: l.id,
        title: prettyListingTitle(l.title),
        price: soles(finalPrice),
        oldPrice: discount ? soles(l.price) : null,
        path: listingPath(l),
        imageUrl: l.images[0]?.url ?? null,
        note: notes.length ? notes.join(" · ") : null,
      } satisfies AssistantCard,
      forModel: {
        nombre: prettyListingTitle(l.title),
        ruta: listingPath(l),
        precio: soles(finalPrice),
        ...(discount ? { precio_antes: soles(l.price) } : {}),
        estado: getConditionLabel(l.condition),
        categoria: l.category,
        entrega: zones.join(", ") || "a coordinar",
        vendedor: l.user.name,
        fotos: l.photoType === "real" ? "reales" : "referenciales",
        acepta_ofertas: l.acceptsOffers,
        ...(notes.length ? { notas: notes.join(", ") } : {}),
      },
    };
  });

  return {
    cards: items.map((i) => i.card),
    result: {
      total_encontradas: total,
      mostrando: items.length,
      ...(partial ? { aviso: "No hubo coincidencia exacta; son resultados parecidos." } : {}),
      ...(input.categoria && !category ? { aviso_categoria: `No existe la categoría "${input.categoria}".` } : {}),
      figuras: items.map((i) => i.forModel),
    },
  };
}

let client: Anthropic | null = null;
function getClient() {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

export async function runAssistant(history: ChatTurn[]): Promise<AssistantResult> {
  const categories = await getCategoryNames();
  const system: Anthropic.TextBlockParam[] = [
    { type: "text", text: assistantStaticPrompt(), cache_control: { type: "ephemeral" } },
    { type: "text", text: assistantDynamicPrompt(categories) },
  ];
  const messages: Anthropic.MessageParam[] = history.map((m) => ({ role: m.role, content: m.content }));

  const cards: AssistantCard[] = [];
  let usedSearch = false;
  let inputTokens = 0;
  let outputTokens = 0;

  for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
    const response = await getClient().messages.create({
      model: ASSISTANT_MODEL,
      max_tokens: MAX_OUTPUT_TOKENS,
      system,
      messages,
      // En la última vuelta ya no se permiten más búsquedas: tiene que responder.
      tools: [SEARCH_TOOL],
      ...(round === MAX_TOOL_ROUNDS ? { tool_choice: { type: "none" as const } } : {}),
    });
    const u = response.usage;
    // Tokens de entrada "a precio normal": escribir en la caché cuesta 1.25×
    // y leer de ella 0.1×. Así el costo estimado del panel es realista.
    inputTokens += Math.round(
      u.input_tokens + 1.25 * (u.cache_creation_input_tokens ?? 0) + 0.1 * (u.cache_read_input_tokens ?? 0)
    );
    outputTokens += u.output_tokens;

    const toolUses = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
    );
    if (response.stop_reason !== "tool_use" || toolUses.length === 0) {
      const answer = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      return { answer, cards: dedupe(cards), usedSearch, inputTokens, outputTokens };
    }

    messages.push({ role: "assistant", content: response.content });
    const results: Anthropic.ToolResultBlockParam[] = [];
    for (const use of toolUses) {
      usedSearch = true;
      try {
        const { cards: found, result } = await searchListings(use.input as SearchInput, categories);
        cards.push(...found);
        results.push({ type: "tool_result", tool_use_id: use.id, content: JSON.stringify(result) });
      } catch (err) {
        console.error("[asistente] búsqueda:", err);
        results.push({
          type: "tool_result",
          tool_use_id: use.id,
          content: "No se pudo buscar en este momento.",
          is_error: true,
        });
      }
    }
    messages.push({ role: "user", content: results });
  }

  return { answer: "", cards: dedupe(cards), usedSearch, inputTokens, outputTokens };
}

// Si buscó varias veces, las tarjetas no se repiten (máximo 6).
function dedupe(cards: AssistantCard[]): AssistantCard[] {
  const seen = new Set<string>();
  return cards.filter((c) => (seen.has(c.id) ? false : (seen.add(c.id), true))).slice(0, SEARCH_LIMIT);
}

export function estimateCostUsd(inputTokens: number, outputTokens: number): number {
  return (inputTokens * PRICE_PER_MTOK.input + outputTokens * PRICE_PER_MTOK.output) / 1_000_000;
}
