import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import UnsubscribeAlertButton from "@/components/UnsubscribeAlertButton";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Dar de baja aviso — FigurasAnime",
  robots: { index: false },
};

type CancelarPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function CancelarAvisoPage({ searchParams }: CancelarPageProps) {
  const { token } = await searchParams;
  const alert = token
    ? await prisma.stockAlert.findUnique({ where: { token }, select: { query: true } })
    : null;

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <Card className="items-center p-8 text-center shadow-sm">
        <p className="text-4xl">🔕</p>
        {alert && token ? (
          <>
            <h1 className="mt-4 text-2xl font-bold text-foreground">Dar de baja el aviso</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Dejarás de recibir correos cuando publiquen <strong>{alert.query}</strong>.
            </p>
            <UnsubscribeAlertButton token={token} />
          </>
        ) : (
          <>
            <h1 className="mt-4 text-2xl font-bold text-foreground">Aviso no encontrado</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Este aviso ya fue dado de baja o el enlace no es válido.
            </p>
          </>
        )}
      </Card>
    </div>
  );
}
