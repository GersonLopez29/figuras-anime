import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import SocialLinks from "@/components/SocialLinks";

export const metadata: Metadata = {
  title: "Contacto — FigurasAnime",
  description: "Escríbenos para sugerencias, negocios o cualquier consulta sobre FigurasAnime.",
};

const CONTACT_EMAIL = "gersonownd@gmail.com";

export default function ContactoPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold text-foreground">Contacto</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        ¿Tienes una sugerencia, una propuesta de negocio o algo que contarnos sobre FigurasAnime?
      </p>

      <Card className="mt-6 p-6 shadow-sm sm:p-8">
        <p className="text-sm leading-relaxed text-foreground/90">
          Escríbenos directamente a:
        </p>
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="mt-3 inline-block text-lg font-semibold text-primary hover:underline"
        >
          {CONTACT_EMAIL}
        </a>
        <p className="mt-4 text-sm text-muted-foreground">
          Este correo es para sugerencias, alianzas o negocios, y consultas generales del sitio. Si tu
          consulta es específica sobre tus datos personales (acceder, corregir o eliminar tu información),
          revisa nuestra{" "}
          <a href="/politica-privacidad" className="font-medium text-primary hover:underline">
            Política de Privacidad
          </a>{" "}
          para el correo correspondiente.
        </p>
      </Card>

      <Card className="mt-6 p-6 shadow-sm sm:p-8">
        <p className="text-sm leading-relaxed text-foreground/90">
          Síguenos para ver las novedades y figuras recién llegadas:
        </p>
        <div className="mt-3">
          <SocialLinks showHandle />
        </div>
      </Card>
    </div>
  );
}
