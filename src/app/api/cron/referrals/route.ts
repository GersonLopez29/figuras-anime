import { NextRequest, NextResponse } from "next/server";
import { claimReferralRewards } from "@/lib/referrals";

export const maxDuration = 60;

// Cron diario: entrega los destacados gratis de los invitados que ya cumplen
// las condiciones (correo confirmado y figura publicada hace 3 días o más).
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const rewarded = await claimReferralRewards();
  return NextResponse.json({ rewarded });
}
