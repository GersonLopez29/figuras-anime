import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Sobre nosotros — FigurasAnime",
  description:
    "Qué es FigurasAnime, por qué existe y cómo funciona el marketplace de compra y venta de figuras de anime en Perú.",
};

export default function SobreNosotrosPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold text-foreground">Sobre FigurasAnime</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        El marketplace de coleccionistas de figuras de anime en Perú.
      </p>

      <Card className="mt-6 p-6 shadow-sm sm:p-8">
        <div className="space-y-8 text-sm leading-relaxed text-foreground/90">
          <section>
            <h2 className="text-lg font-semibold text-foreground">Por qué existe FigurasAnime</h2>
            <p className="mt-2 text-muted-foreground">
              Comprar y vender figuras de anime de segunda mano en Perú solía significar buscar en
              grupos de Facebook dispersos, sin filtros por categoría ni forma de verificar al vendedor.
              FigurasAnime nació para juntar a los coleccionistas en un solo lugar: un catálogo
              ordenado por categoría y estado del producto, donde cada anuncio lleva directo a un
              chat de WhatsApp con quien la vende.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Cómo funciona</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>Cualquier persona puede publicar una figura gratis, con fotos y precio.</li>
              <li>Los compradores filtran por categoría (Naruto, Dragon Ball Z, One Piece y más), estado (nueva o usada) y ofertas activas.</li>
              <li>La coordinación de pago y entrega es directa entre comprador y vendedor por WhatsApp — nosotros no cobramos comisión ni intermediamos el pago.</li>
              <li>Hay una sección de Comunidad para compartir colecciones y hablar de figuras sin necesidad de vender nada.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Quién está detrás</h2>
            <p className="mt-2 text-muted-foreground">
              FigurasAnime es un proyecto independiente hecho por un desarrollador peruano y coleccionista,
              pensado para resolver un problema real de la comunidad otaku local: no había un lugar
              dedicado solo a figuras. Seguimos agregando funciones (comunidad, favoritos, ofertas)
              según lo que pide la comunidad de usuarios.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">Nuestro compromiso</h2>
            <p className="mt-2 text-muted-foreground">
              No vendemos ni tenemos inventario propio: nuestro trabajo es dar visibilidad a los
              anuncios y mantener la plataforma simple, rápida y sin publicaciones falsas o de
              productos prohibidos. Puedes ver el detalle de cómo tratamos tus datos en la{" "}
              <Link href="/politica-privacidad" className="font-medium text-primary hover:underline">
                Política de Privacidad
              </Link>{" "}
              y las reglas de uso en los{" "}
              <Link href="/terminos-condiciones" className="font-medium text-primary hover:underline">
                Términos y Condiciones
              </Link>
              .
            </p>
          </section>

          <section className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground">¿Tienes una figura para vender o buscas una en especial?</p>
            <Button render={<Link href="/" />} nativeButton={false} className="rounded-full">
              Explorar catálogo
            </Button>
          </section>
        </div>
      </Card>
    </div>
  );
}
