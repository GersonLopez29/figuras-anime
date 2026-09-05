import type { Metadata } from "next";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Términos y Condiciones — FigurasAnime",
  description:
    "Reglas de uso de FigurasAnime: cómo funcionan las publicaciones, las compras y ventas entre coleccionistas.",
};

const LAST_UPDATED = "4 de septiembre de 2026";
const CONTACT_EMAIL = "gersonownd@gmail.com";

export default function TerminosCondicionesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold text-foreground">Términos y Condiciones</h1>
      <p className="mt-2 text-sm text-muted-foreground">Última actualización: {LAST_UPDATED}</p>

      <Card className="mt-6 p-6 shadow-sm sm:p-8">
        <div className="space-y-8 text-sm leading-relaxed text-foreground/90">
          <section>
            <p>
              Al usar FigurasAnime (<span className="font-medium">gerstore.club</span>) aceptas estos
              términos. Léelos antes de publicar, comprar o vender una figura en la plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">1. Qué es FigurasAnime</h2>
            <p className="mt-2 text-muted-foreground">
              FigurasAnime es un marketplace que conecta coleccionistas para comprar y vender figuras
              de anime. No vendemos los productos ni los tenemos en inventario: publicamos los anuncios
              que crean los propios usuarios, y la compra se coordina y se paga directamente entre
              comprador y vendedor por WhatsApp.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">2. Cuentas de usuario</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>Debes dar datos reales (nombre, correo, WhatsApp) al registrarte.</li>
              <li>Eres responsable de la actividad que ocurra en tu cuenta.</li>
              <li>Podemos suspender cuentas que incumplan estos términos o publiquen contenido falso.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">3. Publicar una figura</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>La publicación debe describir el producto real, con fotos propias del artículo.</li>
              <li>El precio y el estado (nueva, usada, open box) deben ser precisos.</li>
              <li>
                Está prohibido publicar productos ilegales, réplicas presentadas como originales sin
                indicarlo, o contenido que no corresponda a una figura de colección.
              </li>
              <li>Nos reservamos el derecho de eliminar publicaciones que incumplan estas reglas.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">4. Compras y pagos</h2>
            <p className="mt-2 text-muted-foreground">
              FigurasAnime no procesa pagos ni participa en la transacción: solo facilita el contacto
              entre comprador y vendedor vía WhatsApp. La forma de pago, el envío o la entrega en persona,
              y cualquier garantía sobre el producto se acuerdan directamente entre ambas partes. Te
              recomendamos verificar el estado del producto y coordinar la entrega en un lugar seguro.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">5. Responsabilidad</h2>
            <p className="mt-2 text-muted-foreground">
              No somos responsables por la calidad, autenticidad, legalidad o entrega de los productos
              publicados por los usuarios, ni por disputas entre comprador y vendedor. Actuamos solo como
              intermediario tecnológico que muestra los anuncios.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">6. Cambios a estos términos</h2>
            <p className="mt-2 text-muted-foreground">
              Podemos actualizar estos términos cuando cambiemos la plataforma. La fecha de "Última
              actualización" arriba refleja la versión vigente.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">7. Contacto</h2>
            <p className="mt-2 text-muted-foreground">
              Para consultas sobre estos términos, escríbenos a{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-primary hover:underline">
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </section>
        </div>
      </Card>
    </div>
  );
}
