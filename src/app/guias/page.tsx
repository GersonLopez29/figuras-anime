import Link from "next/link";
import type { Metadata } from "next";
import { GUIDES } from "@/lib/guides";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Guías para coleccionistas de figuras de anime — FigurasAnime",
  description:
    "Aprende a reconocer figuras originales, a elegir entre Banpresto, S.H.Figuarts o Nendoroid, a cuidarlas y a comprar seguro en Perú.",
  alternates: { canonical: "/guias" },
};

export default function GuiasPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold text-foreground">📚 Guías para coleccionistas</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Todo lo que conviene saber antes de comprar, vender o exhibir tus figuras de anime.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {GUIDES.map((guide) => (
          <Link key={guide.slug} href={`/guias/${guide.slug}`} className="group block">
            <Card className="h-full gap-2 p-5 transition group-hover:-translate-y-0.5 group-hover:shadow-md group-hover:ring-primary/30">
              <span aria-hidden="true" className="text-3xl">
                {guide.emoji}
              </span>
              <h2 className="font-semibold text-foreground group-hover:text-primary">{guide.title}</h2>
              <p className="text-sm text-muted-foreground">{guide.description}</p>
              <span className="mt-auto pt-1 text-sm font-medium text-primary">Leer guía →</span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
