import Link from "next/link";
import { categoryPath } from "@/lib/slug";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import SocialLinks from "@/components/SocialLinks";

type CategoryOption = { name: string; icon: string };

type FooterProps = {
  totalVisits: number;
  categories: CategoryOption[];
};

export default function Footer({ totalVisits, categories }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 overflow-hidden rounded-t-3xl border-t border-border bg-card">
      <div aria-hidden="true" className="h-1 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-400" />
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <p className="flex items-center gap-1.5 text-base font-extrabold text-foreground">
              <span aria-hidden="true">🎌</span>
              Figuras<span className="text-orange-600">Anime</span>
            </p>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              El marketplace para comprar y vender figuras de anime entre coleccionistas,
              coordinando todo directo por WhatsApp.
            </p>
            <h3 className="mt-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
              Síguenos
            </h3>
            <div className="mt-3">
              <SocialLinks />
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
              Categorías
            </h3>
            <ul className="mt-3 space-y-2">
              {categories.slice(0, 5).map((cat) => (
                <li key={cat.name}>
                  <Link
                    href={categoryPath(cat.name)}
                    className="inline-block text-sm text-muted-foreground transition hover:translate-x-0.5 hover:text-orange-600"
                  >
                    {cat.icon} {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
              Información
            </h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/" className="inline-block text-sm text-muted-foreground transition hover:translate-x-0.5 hover:text-orange-600">
                  Explorar catálogo
                </Link>
              </li>
              <li>
                <Link href="/publicar" className="inline-block text-sm text-muted-foreground transition hover:translate-x-0.5 hover:text-orange-600">
                  Publicar una figura
                </Link>
              </li>
              <li>
                <Link href="/te-la-vendemos" className="inline-block text-sm text-muted-foreground transition hover:translate-x-0.5 hover:text-orange-600">
                  Te la vendemos
                </Link>
              </li>
              <li>
                <Link href="/comunidad" className="inline-block text-sm text-muted-foreground transition hover:translate-x-0.5 hover:text-orange-600">
                  Comunidad de coleccionistas
                </Link>
              </li>
              <li>
                <Link href="/se-busca" className="inline-block text-sm text-muted-foreground transition hover:translate-x-0.5 hover:text-orange-600">
                  Se busca
                </Link>
              </li>
              <li>
                <Link href="/avisame" className="inline-block text-sm text-muted-foreground transition hover:translate-x-0.5 hover:text-orange-600">
                  Avísame cuando llegue
                </Link>
              </li>
              <li>
                <Link href="/guias" className="inline-block text-sm text-muted-foreground transition hover:translate-x-0.5 hover:text-orange-600">
                  Guías para coleccionistas
                </Link>
              </li>
              <li>
                <Link href="/registro" className="inline-block text-sm text-muted-foreground transition hover:translate-x-0.5 hover:text-orange-600">
                  Crear cuenta
                </Link>
              </li>
              <li>
                <Link href="/sobre-nosotros" className="inline-block text-sm text-muted-foreground transition hover:translate-x-0.5 hover:text-orange-600">
                  Sobre nosotros
                </Link>
              </li>
              <li>
                <Link href="/terminos-condiciones" className="inline-block text-sm text-muted-foreground transition hover:translate-x-0.5 hover:text-orange-600">
                  Términos y Condiciones
                </Link>
              </li>
              <li>
                <Link href="/politica-privacidad" className="inline-block text-sm text-muted-foreground transition hover:translate-x-0.5 hover:text-orange-600">
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link href="/contacto" className="inline-block text-sm text-muted-foreground transition hover:translate-x-0.5 hover:text-orange-600">
                  Contacto
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="mt-10" />
        <div className="flex flex-col items-center gap-2 pt-6 text-center text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <div className="flex flex-col items-center gap-1 sm:flex-row sm:gap-3">
            <p>FigurasAnime © {year} — Compra y venta entre coleccionistas</p>
            <Link
              href="/politica-privacidad"
              className="underline-offset-2 hover:text-orange-600 hover:underline"
            >
              Política de Privacidad
            </Link>
          </div>
          <Badge variant="secondary" className="h-auto gap-1 px-2.5 py-1 font-medium">
            <span aria-hidden="true">📊</span>
            {totalVisits.toLocaleString("es-PE")} visitas totales
          </Badge>
        </div>
      </div>
    </footer>
  );
}
