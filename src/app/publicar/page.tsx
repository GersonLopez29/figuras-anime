import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser, isAdmin } from "@/lib/session";
import { getCategories } from "@/lib/categories";
import { prisma } from "@/lib/db";
import { hasWelcomeBonus, WELCOME_BONUS_DAYS } from "@/lib/sellerRewards";
import ListingForm from "@/components/ListingForm";
import EmailVerificationBanner from "@/components/EmailVerificationBanner";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export const metadata: Metadata = {
  title: "Publicar una figura — FigurasAnime",
  // Sin sesión redirige al login: no es una página para Google.
  robots: { index: false, follow: true },
};

export default async function PublicarPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (!user.emailVerified) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10">
        <h1 className="text-2xl font-bold text-foreground">Publicar una figura</h1>
        <Alert className="mt-6">
          <AlertTitle>Verifica tu correo para publicar</AlertTitle>
          <AlertDescription>
            Necesitas confirmar tu correo ({user.email}) antes de poder publicar figuras.
          </AlertDescription>
        </Alert>
        <div className="mt-3 overflow-hidden rounded-lg border border-border">
          <EmailVerificationBanner />
        </div>
      </div>
    );
  }

  const [categories, lastListing, welcomeBonus] = await Promise.all([
    getCategories(),
    prisma.listing.findFirst({
      where: { userId: user.id, NOT: { deliveryZones: { isEmpty: true } } },
      orderBy: { createdAt: "desc" },
      select: { deliveryZones: true, deliveryNotes: true },
    }),
    isAdmin(user) ? Promise.resolve(false) : hasWelcomeBonus(user.id),
  ]);

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-bold text-foreground">Publicar una figura</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Los compradores te contactarán por WhatsApp al número{" "}
        <span className="font-medium text-foreground/80">{user.whatsapp}</span>.
      </p>

      {welcomeBonus && (
        <Alert className="mt-6 border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40">
          <AlertTitle className="text-amber-900 dark:text-amber-200">🎁 Regalo de bienvenida</AlertTitle>
          <AlertDescription className="text-amber-900 dark:text-amber-200">
            Tu primera figura con 📷 fotos reales sale ⭐ destacada {WELCOME_BONUS_DAYS} días gratis
            apenas la publiques: aparece arriba del catálogo.
          </AlertDescription>
        </Alert>
      )}

      <div className="mt-8">
        <ListingForm
          mode="create"
          categories={categories}
          defaultDeliveryZones={lastListing?.deliveryZones}
          defaultDeliveryNotes={lastListing?.deliveryNotes}
        />
      </div>
    </div>
  );
}
