import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/session";
import StockAlertForm from "@/components/StockAlertForm";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Avísame cuando llegue — FigurasAnime",
  description:
    "Dinos qué figura de anime buscas y te avisamos por correo apenas alguien la publique en FigurasAnime.",
  alternates: { canonical: "/avisame" },
};

type AvisamePageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function AvisamePage({ searchParams }: AvisamePageProps) {
  const { q } = await searchParams;
  const user = await getCurrentUser();

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-3xl font-bold text-foreground">🔔 Avísame cuando llegue</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        ¿No encuentras la figura que buscas? Déjanos tu correo y te avisamos apenas alguien la
        publique.
      </p>

      <Card className="mt-6 p-6 shadow-sm">
        <StockAlertForm defaultQuery={q?.slice(0, 80) ?? ""} defaultEmail={user?.email ?? ""} />
      </Card>

      <div className="mt-6 rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
        <p className="font-semibold text-foreground">¿Cómo funciona?</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Escribe el personaje, la serie o la línea (ej. &quot;Zoro&quot;, &quot;SH Figuarts Vegeta&quot;).</li>
          <li>Confirma tu correo con el enlace que te enviamos.</li>
          <li>Cuando publiquen una figura que coincida, te llega un correo con la foto y el precio.</li>
          <li>El aviso dura 6 meses y puedes darte de baja cuando quieras.</li>
        </ul>
      </div>
    </div>
  );
}
