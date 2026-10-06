import { z } from "zod";

// Preventas: figuras que todavía no llegan. El vendedor indica el mes estimado
// de llegada (input type="month", "2026-12") y, si pide, un adelanto.

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

// "2026-12" → 1 dic 2026 (UTC). Se guarda el primer día del mes.
export function monthToDate(month: string): Date {
  return new Date(`${month}-01T00:00:00.000Z`);
}

// Date → "2026-12" para precargar el input al editar.
export function dateToMonth(date: Date | null | undefined): string {
  if (!date) return "";
  return date.toISOString().slice(0, 7);
}

// "diciembre de 2026". Se usa UTC para que no se corra al mes anterior en Lima.
export function formatArrival(date: Date): string {
  return date.toLocaleDateString("es-PE", { month: "long", year: "numeric", timeZone: "UTC" });
}

export const preorderFieldsSchema = z
  .object({
    isPreorder: z.boolean(),
    preorderArrival: z.string().trim(),
    preorderDeposit: z.string().trim(),
  })
  .transform((data, ctx) => {
    if (!data.isPreorder) {
      return { isPreorder: false, preorderArrival: null, preorderDeposit: null };
    }
    if (!MONTH_PATTERN.test(data.preorderArrival)) {
      ctx.addIssue({ code: "custom", message: "Indica el mes estimado de llegada de la preventa" });
      return z.NEVER;
    }
    let deposit: number | null = null;
    if (data.preorderDeposit !== "") {
      deposit = Number(data.preorderDeposit);
      if (!Number.isFinite(deposit) || deposit <= 0) {
        ctx.addIssue({ code: "custom", message: "El adelanto debe ser un monto mayor a 0" });
        return z.NEVER;
      }
    }
    return {
      isPreorder: true,
      preorderArrival: monthToDate(data.preorderArrival),
      preorderDeposit: deposit,
    };
  });

export function readPreorderFields(formData: FormData) {
  return {
    isPreorder: formData.get("isPreorder") === "true",
    preorderArrival: String(formData.get("preorderArrival") ?? ""),
    preorderDeposit: String(formData.get("preorderDeposit") ?? ""),
  };
}
