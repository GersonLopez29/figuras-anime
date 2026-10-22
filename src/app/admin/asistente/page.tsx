import { Bot } from "lucide-react";
import { prisma } from "@/lib/db";
import { assistantEnabled, ASSISTANT_MODEL, estimateCostUsd } from "@/lib/assistant";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminEmpty, AdminFilterChips, AdminPageHeader } from "@/components/admin/AdminUi";

const BASE = "/admin/asistente";
const DAY_MS = 24 * 60 * 60 * 1000;
const LIST_LIMIT = 100;

type Props = { searchParams: Promise<{ filtro?: string }> };

// Consultas del panel (fuera del componente: usa la hora actual).
async function loadAssistantData(onlyFailed: boolean, onlySearch: boolean) {
  const now = Date.now();
  const since = (days: number) => new Date(now - days * DAY_MS);
  return Promise.all([
    prisma.assistantMessage.count({ where: { createdAt: { gte: since(1) } } }),
    prisma.assistantMessage.count({ where: { createdAt: { gte: since(7) } } }),
    prisma.assistantMessage.count({ where: { createdAt: { gte: since(30) } } }),
    prisma.assistantMessage.aggregate({
      where: { createdAt: { gte: since(30) } },
      _sum: { inputTokens: true, outputTokens: true },
    }),
    prisma.assistantMessage.count({ where: { createdAt: { gte: since(30) }, usedSearch: true } }),
    prisma.assistantMessage.count({ where: { createdAt: { gte: since(30) }, failed: true } }),
    prisma.assistantMessage.findMany({
      where: onlyFailed ? { failed: true } : onlySearch ? { usedSearch: true } : undefined,
      orderBy: { createdAt: "desc" },
      take: LIST_LIMIT,
      select: { id: true, question: true, answer: true, usedSearch: true, failed: true, createdAt: true, userId: true },
    }),
  ]);
}

export default async function AdminAsistentePage({ searchParams }: Props) {
  const filtro = (await searchParams).filtro;
  const onlyFailed = filtro === "fallidas";
  const onlySearch = filtro === "busquedas";
  const [day, week, month, monthTokens, monthSearch, monthFailed, recent] = await loadAssistantData(
    onlyFailed,
    onlySearch
  );
  const cost = estimateCostUsd(monthTokens._sum.inputTokens ?? 0, monthTokens._sum.outputTokens ?? 0);

  const stats = [
    { label: "Preguntas hoy", value: day.toLocaleString("es-PE") },
    { label: "Últimos 7 días", value: week.toLocaleString("es-PE") },
    { label: "Últimos 30 días", value: month.toLocaleString("es-PE") },
    { label: "Costo aprox. 30 días", value: `US$ ${cost.toFixed(2)}` },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Bot}
        title="Asistente"
        description={
          <>
            Lo que la gente le pregunta al chat de la página. Útil para saber qué buscan y qué no
            se entiende. Las conversaciones se guardan 90 días. Modelo: {ASSISTANT_MODEL}.
          </>
        }
      />

      {!assistantEnabled() && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          <p className="font-semibold">El asistente está apagado</p>
          <p className="mt-1">
            Falta la clave de la API de Claude. Crea una en platform.claude.com → API Keys, agrégala
            en Vercel como <code className="font-mono">ANTHROPIC_API_KEY</code> (Production) y haz
            Redeploy. Mientras tanto se muestra el botón de Sugerencias como antes.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="gap-1 p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-bold tabular-nums text-foreground">{s.value}</p>
          </Card>
        ))}
      </div>
      <p className="-mt-3 text-xs text-muted-foreground">
        En 30 días: {monthSearch} buscaron en el catálogo, {monthFailed} no se pudieron responder.
        Para controlar el gasto, pon un límite mensual en platform.claude.com → Billing.
      </p>

      <AdminFilterChips
        basePath={BASE}
        param="filtro"
        active={onlyFailed ? "fallidas" : onlySearch ? "busquedas" : "todas"}
        current={{ filtro }}
        label="Filtrar preguntas"
        filters={[
          { value: "todas", label: "Todas" },
          { value: "busquedas", label: "🔎 Buscaron figuras" },
          { value: "fallidas", label: "⚠️ Sin respuesta" },
        ]}
      />

      {recent.length === 0 ? (
        <AdminEmpty>Todavía no hay preguntas.</AdminEmpty>
      ) : (
        <Card className="gap-0 divide-y divide-border py-0 shadow-sm">
          {recent.map((m) => (
            <details key={m.id} className="group p-4">
              <summary className="flex cursor-pointer list-none flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                <span className="min-w-0 text-sm font-medium text-foreground">{m.question}</span>
                <span className="flex shrink-0 flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  {m.usedSearch && <Badge variant="secondary">🔎 búsqueda</Badge>}
                  {m.failed && <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">sin respuesta</Badge>}
                  {m.userId && <Badge variant="outline">con cuenta</Badge>}
                  {m.createdAt.toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short", timeZone: "America/Lima" })}
                </span>
              </summary>
              <p className="mt-2 whitespace-pre-line rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                {m.answer}
              </p>
            </details>
          ))}
        </Card>
      )}
    </div>
  );
}
