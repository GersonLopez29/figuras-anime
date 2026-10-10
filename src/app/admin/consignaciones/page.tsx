import { prisma } from "@/lib/db";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { formatPrice } from "@/lib/format";
import { CONSIGNMENT_COMMISSION_PERCENT, getConsignmentStatus } from "@/lib/consignment";
import ConsignmentStatusSelect from "@/components/admin/ConsignmentStatusSelect";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Abiertas primero (nuevas, contactadas, en venta), después las cerradas.
const STATUS_ORDER = ["nuevo", "contactado", "aceptado", "vendido", "rechazado"];

export default async function AdminConsignacionesPage() {
  const requests = await prisma.consignmentRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, whatsapp: true, email: true } } },
  });
  requests.sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status));

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground">
        Solicitudes &quot;Te la vendemos&quot; ({requests.length})
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Comisión publicada: {CONSIGNMENT_COMMISSION_PERCENT}%. Escríbele al coleccionista,
        acuerden el precio y cambia el estado a medida que avanza.
      </p>

      {requests.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">Todavía no hay solicitudes.</p>
      ) : (
        <Card className="mt-4 gap-0 divide-y divide-border py-0">
          {requests.map((req) => {
            const status = getConsignmentStatus(req.status);
            return (
              <div key={req.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-foreground">{req.figure}</p>
                    <Badge className={status.className}>{status.label}</Badge>
                  </div>
                  <p className="whitespace-pre-line text-sm text-muted-foreground">{req.details}</p>
                  <p className="text-sm text-muted-foreground">
                    {req.user.name} · {req.user.whatsapp}
                    {req.expectedPrice !== null && <> · espera {formatPrice(req.expectedPrice)}</>} ·{" "}
                    {req.createdAt.toLocaleDateString("es-PE", { timeZone: "America/Lima" })}
                  </p>
                  <a
                    href={buildWhatsAppLink(
                      req.user.whatsapp,
                      `Hola ${req.user.name}, te escribo de FigurasAnime por tu figura "${req.figure}" que quieres que vendamos. ¿Me mandas unas fotos?`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-xs font-medium text-green-700 dark:text-green-300 underline"
                  >
                    Escribirle por WhatsApp
                  </a>
                </div>
                <div className="shrink-0">
                  <ConsignmentStatusSelect id={req.id} status={req.status} />
                </div>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
