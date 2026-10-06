import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { REFERRAL_COOKIE, REFERRAL_COOKIE_DAYS, isReferralCodeShape } from "@/lib/referrals";

// Enlace de invitación: gerstore.club/r/<código>. Guarda el código en una
// cookie (30 días) y lleva al registro; el registro lo lee al crear la cuenta.
export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code: rawCode } = await params;
  const code = rawCode.toLowerCase();
  const response = NextResponse.redirect(new URL("/registro", request.url));

  if (isReferralCodeShape(code)) {
    const referrer = await prisma.user.findUnique({
      where: { referralCode: code },
      select: { id: true, isBlocked: true },
    });
    if (referrer && !referrer.isBlocked) {
      response.cookies.set(REFERRAL_COOKIE, code, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: REFERRAL_COOKIE_DAYS * 24 * 60 * 60,
        path: "/",
      });
    }
  }
  return response;
}
