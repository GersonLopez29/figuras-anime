import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import ConfirmAlertButton from "@/components/ConfirmAlertButton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Activar aviso — FigurasAnime",
  robots: { index: false },
};

type ConfirmarPageProps = {
  searchParams: Promise<{ token?: string }>;
};

// Solo muestra el botón: el aviso se activa al tocarlo (POST), no al abrir el
// enlace, para que los filtros de correo que abren enlaces no lo activen solos.
export default async function ConfirmarAvisoPage({ searchParams }: ConfirmarPageProps) {
  const { token } = await searchParams;
  const alert = token
    ? await prisma.stockAlert.findUnique({
        where: { token },
        select: { query: true, confirmedAt: true },
      })
    : null;

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <Card className="items-center p-8 text-center shadow-sm">
        <p className="text-4xl">{alert ? "🔔" : "✉️"}</p>
        {alert && token ? (
          <>
            <h1 className="mt-4 text-2xl font-bold text-foreground">
              {alert.confirmedAt ? "Tu aviso ya está activo" : "Activa tu aviso"}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Te escribiremos cuando publiquen una figura de <strong>{alert.query}</strong>.
            </p>
            {alert.confirmedAt ? (
              <Button
                render={<Link href={`/?q=${encodeURIComponent(alert.query)}#catalogo`} />}
                nativeButton={false}
                className="mt-6 rounded-full"
              >
                Ver lo que hay ahora
              </Button>
            ) : (
              <ConfirmAlertButton token={token} query={alert.query} />
            )}
          </>
        ) : (
          <>
            <h1 className="mt-4 text-2xl font-bold text-foreground">Enlace vencido</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Este enlace no es válido o el aviso venció sin activarse (hay 48 horas para hacerlo).
            </p>
            <Button render={<Link href="/avisame" />} nativeButton={false} className="mt-6 rounded-full">
              Crear un aviso
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
