import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { GUIDES, getGuide } from "@/lib/guides";
import { Button } from "@/components/ui/button";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gerstore.club";

type GuidePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return { title: "Guía no encontrada — FigurasAnime" };
  const title = `${guide.title} | FigurasAnime`;
  return {
    title,
    description: guide.description,
    alternates: { canonical: `/guias/${guide.slug}` },
    openGraph: { title, description: guide.description, type: "article", url: `/guias/${guide.slug}` },
  };
}

function formatUpdated(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("es-PE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Lima",
  });
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  const others = GUIDES.filter((g) => g.slug !== guide.slug);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    dateModified: guide.updated,
    url: `${SITE_URL}/guias/${guide.slug}`,
    inLanguage: "es-PE",
    publisher: { "@type": "Organization", name: "FigurasAnime", url: SITE_URL },
  };

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link href="/guias" className="text-sm text-muted-foreground hover:text-foreground">
        &larr; Todas las guías
      </Link>

      <header className="mt-4">
        <span aria-hidden="true" className="text-4xl">
          {guide.emoji}
        </span>
        <h1 className="mt-2 text-3xl font-bold leading-tight text-foreground">{guide.title}</h1>
        <p className="mt-2 text-xs text-muted-foreground">Actualizada el {formatUpdated(guide.updated)}</p>
        <p className="mt-4 text-base leading-relaxed text-foreground/90">{guide.intro}</p>
      </header>

      <div className="mt-8 space-y-8">
        {guide.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-xl font-semibold text-foreground">{section.heading}</h2>
            {section.paragraphs?.map((p) => (
              <p key={p.slice(0, 40)} className="mt-3 text-sm leading-relaxed text-foreground/80 sm:text-base">
                {p}
              </p>
            ))}
            {section.bullets && (
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-foreground/80 sm:text-base">
                {section.bullets.map((b) => (
                  <li key={b.slice(0, 40)}>{b}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap gap-2">
        {guide.links.map((link) => (
          <Button
            key={link.href}
            render={<Link href={link.href} />}
            nativeButton={false}
            variant="outline"
            className="rounded-full"
          >
            {link.label}
          </Button>
        ))}
      </div>

      <div className="mt-10 rounded-2xl bg-orange-50/70 dark:bg-orange-950/40 p-5 ring-1 ring-orange-200 dark:ring-orange-800">
        <p className="font-semibold text-foreground">🔔 ¿Buscas una figura en particular?</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Te avisamos por correo cuando alguien la publique, sin registrarte.
        </p>
        <Button
          render={<Link href="/avisame" />}
          nativeButton={false}
          className="mt-3 rounded-full"
        >
          Crear un aviso
        </Button>
      </div>

      <aside className="mt-12">
        <h2 className="text-lg font-semibold text-foreground">Más guías</h2>
        <ul className="mt-3 space-y-2">
          {others.map((g) => (
            <li key={g.slug}>
              <Link href={`/guias/${g.slug}`} className="text-sm font-medium text-primary hover:underline">
                {g.emoji} {g.title}
              </Link>
            </li>
          ))}
        </ul>
      </aside>
    </article>
  );
}
