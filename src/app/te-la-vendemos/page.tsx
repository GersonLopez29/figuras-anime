import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/session";
import { CONSIGNMENT_COMMISSION_PERCENT } from "@/lib/consignment";
import { OFFICIAL_STORE_NAME } from "@/lib/store";
import ConsignmentForm from "@/components/ConsignmentForm";
import VerifyEmailToContact from "@/components/VerifyEmailToContact";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Te la vendemos — vende tus figuras sin esfuerzo | FigurasAnime",
  description: `¿Tienes figuras de anime que ya no usas? ${OFFICIAL_STORE_NAME} las vende por ti en Lima: nosotros publicamos, atendemos a los compradores y entregamos. Solo cobramos una comisión del ${CONSIGNMENT_COMMISSION_PERCENT}% si se vende.`,
  alternates: { canonical: "/te-la-vendemos" },
};

const STEPS = [
  {
    icon: "💬",
    title: "Cuéntanos qué figura es",
    text: "Llena el formulario. Te escribimos por WhatsApp para ver fotos y acordar el precio contigo.",
  },
  {
    icon: "📸",
    title: "Nosotros la publicamos",
    text: `La publicamos en ${OFFICIAL_STORE_NAME} con buenas fotos, la destacamos y atendemos a los interesados.`,
  },
  {
    icon: "🤝",
    title: "Coordinamos la entrega",
    text: "Nos encargamos de responder preguntas, negociar y entregarla al comprador.",
  },
  {
    icon: "💸",
    title: "Te pagamos",
    text: `Cuando se vende, te pagamos el precio acordado menos una comisión del ${CONSIGNMENT_COMMISSION_PERCENT}%. Si no se vende, te la devolvemos sin costo.`,
  },
];

export default async function TeLaVendemosPage() {
  const user = await getCurrentUser();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <p className="inline-block rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-orange-700 ring-1 ring-orange-100">
        📦 Venta por consignación
      </p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground">
        Te la vendemos
      </h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        ¿Tienes figuras que ya no usas pero no tienes tiempo de publicarlas, responder mensajes y
        hacer entregas? Déjanoslas a nosotros. Solo cobramos si se vende.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {STEPS.map((step, i) => (
          <Card key={step.title} className="flex-row items-start gap-4 p-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-100 to-red-50 text-xl ring-1 ring-orange-100">
              {step.icon}
            </span>
            <div>
              <h2 className="font-semibold text-foreground">
                {i + 1}. {step.title}
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">{step.text}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-8 p-6 sm:p-8">
        <h2 className="text-lg font-bold text-foreground">Cuéntanos qué quieres vender</h2>
        <div className="mt-4">
          {!user ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Inicia sesión para enviarnos tu figura. Así sabemos a qué WhatsApp escribirte.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  render={<Link href="/login?volver=%2Fte-la-vendemos" />}
                  nativeButton={false}
                  className="rounded-full"
                >
                  Iniciar sesión
                </Button>
                <Button
                  render={<Link href="/registro" />}
                  nativeButton={false}
                  variant="outline"
                  className="rounded-full"
                >
                  Crear cuenta
                </Button>
              </div>
            </div>
          ) : !user.emailVerified ? (
            <VerifyEmailToContact />
          ) : (
            <ConsignmentForm whatsapp={user.whatsapp} />
          )}
        </div>
      </Card>

      <p className="mt-6 text-xs text-muted-foreground">
        ¿Prefieres venderla tú mismo?{" "}
        <Link href="/publicar" className="font-medium text-primary hover:underline">
          Publícala gratis
        </Link>{" "}
        y los compradores te escriben directo.
      </p>
    </div>
  );
}
