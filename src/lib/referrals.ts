import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { FEATURE_DAYS } from "@/lib/featured";
import { sendReferralRewardEmail } from "@/lib/email";

export const REFERRAL_COOKIE = "ref";
export const REFERRAL_COOKIE_DAYS = 30;
// Máximo de destacados gratis que se pueden ganar invitando en 30 días.
export const REFERRAL_MAX_REWARDS_PER_MONTH = 5;
export const REFERRAL_REWARD_DAYS = FEATURE_DAYS;

// Sin letras que se confunden (0/O, 1/l/I).
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

function randomCode(length = 7): string {
  const bytes = randomBytes(length);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export function isReferralCodeShape(code: string): boolean {
  return /^[a-z0-9]{4,16}$/.test(code);
}

export async function getOrCreateReferralCode(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { referralCode: true } });
  if (user?.referralCode) return user.referralCode;
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode();
    const updated = await prisma.user.updateMany({
      where: { id: userId, referralCode: null },
      data: { referralCode: code },
    }).catch(() => null); // código repetido (único): se intenta otro
    if (updated?.count === 1) return code;
    const again = await prisma.user.findUnique({ where: { id: userId }, select: { referralCode: true } });
    if (again?.referralCode) return again.referralCode;
  }
  throw new Error("No se pudo generar el código de invitación");
}

// La figura del invitado debe seguir publicada estos días para que cuente
// (publicar algo y borrarlo enseguida no da premio).
export const REFERRAL_LISTING_MIN_DAYS = 3;

function digits(phone: string) {
  return phone.replace(/\D/g, "");
}

// "juan.perez+algo@gmail.com" y "juanperez@gmail.com" son el mismo buzón.
function normalizedEmail(email: string) {
  const [local, domain = ""] = email.toLowerCase().split("@");
  const base = local.split("+")[0];
  const isGmail = domain === "gmail.com" || domain === "googlemail.com";
  return `${isGmail ? base.replace(/\./g, "") : base}@${isGmail ? "gmail.com" : domain}`;
}

// Entrega los destacados gratis ganados: un invitado cuenta cuando confirmó su
// correo y tiene una figura publicada hace al menos REFERRAL_LISTING_MIN_DAYS
// días. Se llama a diario (cron) y cuando quien invitó abre Mis figuras o
// Invitar. Con referrerId revisa solo a sus invitados.
export async function claimReferralRewards(referrerId?: string): Promise<number> {
  const listingCutoff = new Date(Date.now() - REFERRAL_LISTING_MIN_DAYS * 24 * 60 * 60 * 1000);
  const candidates = await prisma.user.findMany({
    where: {
      referralRewardedAt: null,
      emailVerified: true,
      isBlocked: false,
      ...(referrerId ? { referredById: referrerId } : { referredById: { not: null } }),
      referredBy: { isBlocked: false },
      listings: { some: { createdAt: { lte: listingCutoff } } },
    },
    select: {
      id: true,
      name: true,
      email: true,
      whatsapp: true,
      referredBy: { select: { id: true, name: true, email: true, whatsapp: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  let rewarded = 0;
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  for (const invited of candidates) {
    const referrer = invited.referredBy;
    if (!referrer) continue;
    // Mismo WhatsApp o mismo buzón de correo = la misma persona con otra cuenta.
    if (
      digits(invited.whatsapp) === digits(referrer.whatsapp) ||
      normalizedEmail(invited.email) === normalizedEmail(referrer.email)
    ) {
      continue;
    }

    const recentRewards = await prisma.user.count({
      where: { referredById: referrer.id, referralRewardedAt: { gte: monthAgo } },
    });
    if (recentRewards >= REFERRAL_MAX_REWARDS_PER_MONTH) continue;

    // Marcar al invitado y sumar el destacado en una sola transacción; el
    // filtro referralRewardedAt: null evita premiar dos veces si el cron y una
    // visita coinciden.
    const granted = await prisma.$transaction(async (tx) => {
      const claimed = await tx.user.updateMany({
        where: { id: invited.id, referralRewardedAt: null },
        data: { referralRewardedAt: new Date() },
      });
      if (claimed.count !== 1) return false;
      await tx.user.update({
        where: { id: referrer.id },
        data: { freeFeatureCredits: { increment: 1 } },
      });
      return true;
    });
    if (!granted) continue;
    rewarded++;
    await sendReferralRewardEmail(referrer.email, referrer.name, invited.name, REFERRAL_REWARD_DAYS);
  }
  return rewarded;
}
