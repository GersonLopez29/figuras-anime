import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import {
  REFERRAL_LISTING_MIN_DAYS,
  REFERRAL_MAX_REWARDS_PER_MONTH,
  REFERRAL_REWARD_DAYS,
  claimReferralRewards,
  getOrCreateReferralCode,
} from "@/lib/referrals";
import InviteShare from "@/components/InviteShare";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Invita y gana destacados gratis — FigurasAnime",
  robots: { index: false },
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gerstore.club";

export default async function InvitarPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  await claimReferralRewards(user.id);
  const [code, stats] = await Promise.all([
    getOrCreateReferralCode(user.id),
    prisma.user.findUnique({
      where: { id: user.id },
      select: {
        freeFeatureCredits: true,
        _count: { select: { referrals: true } },
        referrals: { where: { referralRewardedAt: { not: null } }, select: { id: true } },
      },
    }),
  ]);
  const link = `${SITE_URL}/r/${code}`;
  const invited = stats?._count.referrals ?? 0;
  const rewarded = stats?.referrals.length ?? 0;
  const credits = stats?.freeFeatureCredits ?? 0;

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-3xl font-bold text-foreground">🎁 Invita y gana destacados</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Por cada amigo que se registre con tu enlace y publique su primera figura, ganas{" "}
        <strong>un destacado gratis de {REFERRAL_REWARD_DAYS} días</strong> para la figura que quieras.
      </p>

      <Card className="mt-6 gap-4 p-6 shadow-sm">
        <h2 className="font-semibold text-foreground">Tu enlace de invitación</h2>
        <InviteShare link={link} />
      </Card>

      <div className="mt-6 grid grid-cols-3 gap-3 text-center">
        {[
          { value: invited, label: invited === 1 ? "amigo invitado" : "amigos invitados" },
          { value: rewarded, label: rewarded === 1 ? "te dio premio" : "te dieron premio" },
          { value: credits, label: credits === 1 ? "destacado disponible" : "destacados disponibles" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg bg-muted/50 p-3">
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {credits > 0 && (
        <Button
          render={<Link href="/mis-figuras" />}
          nativeButton={false}
          className="mt-4 w-full rounded-full"
        >
          Usar mis destacados en Mis figuras
        </Button>
      )}

      <div className="mt-6 rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
        <p className="font-semibold text-foreground">Reglas</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Tu amigo debe crear su cuenta desde tu enlace (vale por 30 días en su navegador).</li>
          <li>
            El premio llega cuando confirma su correo y su figura lleva {REFERRAL_LISTING_MIN_DAYS} días
            publicada. Te avisamos por correo.
          </li>
          <li>Hasta {REFERRAL_MAX_REWARDS_PER_MONTH} destacados gratis por mes.</li>
          <li>
            Las cuentas creadas por la misma persona (mismo WhatsApp o mismo correo) no cuentan.
          </li>
        </ul>
      </div>
    </div>
  );
}
