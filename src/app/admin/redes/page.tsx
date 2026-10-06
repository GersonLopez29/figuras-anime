import { getWeeklyListings } from "@/lib/storyImage";
import { formatPrice, getActiveDiscountAmount, getFinalPrice } from "@/lib/format";
import StoryShareButton from "@/components/StoryShareButton";
import CopyTextButton from "@/components/admin/CopyTextButton";
import { Card } from "@/components/ui/card";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gerstore.club";
const SITE_HOST = SITE_URL.replace(/^https?:\/\//, "");

const HASHTAGS =
  "#figurasanime #coleccionista #shfiguarts #ichibankuji #dragonballz #onepiece #naruto #animeperu #lima #coleccionables";

export default async function AdminRedesPage() {
  const listings = await getWeeklyListings(6);
  const date = new Date().toISOString().slice(0, 10);

  const caption = [
    "🔥 Novedades de la semana en FigurasAnime",
    "",
    ...listings.map((l) => {
      const price = getFinalPrice(l.price, getActiveDiscountAmount(l.discountAmount, l.discountExpiresAt));
      return `• ${l.title} — ${formatPrice(price)}`;
    }),
    "",
    `Míralas todas y escribe directo al vendedor por WhatsApp, sin registrarte 👉 ${SITE_HOST}`,
    "",
    HASHTAGS,
  ].join("\n");

  const formats = [
    {
      key: "historia",
      title: "Historia (1080×1920)",
      text: "Para historias de Instagram, Facebook y WhatsApp, o como portada de TikTok. Agrega el sticker de enlace a gerstore.club.",
      imgClass: "aspect-[9/16] max-w-[260px]",
    },
    {
      key: "post",
      title: "Publicación (1080×1350)",
      text: "Para el feed de Instagram y Facebook, o para los grupos de coleccionistas.",
      imgClass: "aspect-[4/5] max-w-[320px]",
    },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Imágenes para redes</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          &quot;Novedades de la semana&quot; con las figuras disponibles publicadas en los últimos 7
          días (o las más recientes, si hay pocas). Se generan al momento con los precios
          actuales. Para una sola figura, usa el botón &quot;📲 Historia&quot; en Mis figuras o en la
          ficha.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {formats.map((f) => (
          <Card key={f.key} className="items-center gap-3 p-4 text-center">
            <h3 className="font-semibold text-foreground">{f.title}</h3>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/admin/redes?formato=${f.key}`}
              alt={`Novedades de la semana, formato ${f.title}`}
              className={`w-full rounded-xl border border-border bg-muted object-cover ${f.imgClass}`}
            />
            <p className="text-xs text-muted-foreground">{f.text}</p>
            <StoryShareButton
              imageUrl={`/api/admin/redes?formato=${f.key}`}
              fileName={`figurasanime-novedades-${date}-${f.key}.png`}
              shareText={caption}
              label="📲 Compartir o descargar"
            />
          </Card>
        ))}
      </div>

      <Card className="gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-foreground">Texto sugerido para la publicación</h3>
          <CopyTextButton text={caption} />
        </div>
        <pre className="whitespace-pre-wrap rounded-lg bg-muted/50 p-3 font-sans text-sm text-foreground">
          {caption}
        </pre>
      </Card>
    </div>
  );
}
