import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";
import { formatPrice, getActiveDiscountAmount, getFinalPrice } from "@/lib/format";
import { getDeliveryZoneLabel, sortDeliveryZones } from "@/lib/delivery";
import { getActiveReservation } from "@/lib/reservation";
import { OFFICIAL_STORE_NAME } from "@/lib/store";
import {
  GREEN,
  INK,
  MUTED,
  ORANGE,
  SITE_HOST,
  conditionLabel,
  fontsPromise,
  loadPhoto,
  truncate,
} from "@/lib/imageKit";

// Imágenes verticales 1080×1920 para historias de Instagram, Facebook,
// WhatsApp y TikTok. Instagram tapa ~250 px arriba (perfil) y abajo (responder),
// así que lo importante va entre esas franjas.

export const STORY_SIZE = { width: 1080, height: 1920 };

const BACKGROUND = "linear-gradient(160deg, #f97316 0%, #ea580c 45%, #b91c1c 100%)";

function StoryPill({ children, background, color }: { children: string; background: string; color: string }) {
  return (
    <div
      style={{
        display: "flex",
        padding: "10px 26px",
        borderRadius: 999,
        background,
        color,
        fontSize: 32,
        fontWeight: 700,
      }}
    >
      {children}
    </div>
  );
}

function BrandHeader({ subtitle }: { subtitle: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}>
      <div style={{ display: "flex", fontSize: 76, fontWeight: 900, color: "#ffffff", letterSpacing: -1 }}>
        FigurasAnime
      </div>
      <div style={{ display: "flex", fontSize: 32, fontWeight: 500, color: "rgba(255,255,255,0.9)" }}>
        {subtitle}
      </div>
    </div>
  );
}

function FooterCta({ text }: { text: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 56px",
        borderRadius: 999,
        background: "#ffffff",
        color: ORANGE,
        fontSize: 44,
        fontWeight: 900,
      }}
    >
      {text}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Historia de una figura
// ---------------------------------------------------------------------------

const PHOTO_W = 960;
const PHOTO_H = 760;

export async function renderListingStory(id: string): Promise<ImageResponse | null> {
  const [fonts, listing] = await Promise.all([
    fontsPromise,
    prisma.listing.findUnique({
      where: { id },
      select: {
        title: true,
        price: true,
        discountAmount: true,
        discountExpiresAt: true,
        category: true,
        condition: true,
        sold: true,
        isPreorder: true,
        reservedAmount: true,
        reservedUntil: true,
        deliveryZones: true,
        images: { take: 1, select: { url: true } },
        user: { select: { name: true, isOfficialStore: true } },
      },
    }),
  ]);
  if (!listing) return null;

  const photo = await loadPhoto(listing.images[0]?.url, PHOTO_W, PHOTO_H);
  const discount = listing.sold
    ? null
    : getActiveDiscountAmount(listing.discountAmount, listing.discountExpiresAt);
  const finalPrice = getFinalPrice(listing.price, discount);
  const reserved = !listing.sold && !!getActiveReservation(listing.reservedAmount, listing.reservedUntil);
  const zones = sortDeliveryZones(listing.deliveryZones).map(getDeliveryZoneLabel);
  const zoneText =
    zones.length === 0
      ? "Entrega en Lima"
      : `Entrega: ${zones.slice(0, 2).join(" · ")}${zones.length > 2 ? ` +${zones.length - 2}` : ""}`;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          height: "100%",
          background: BACKGROUND,
          fontFamily: "Geist",
          padding: "190px 60px 0",
        }}
      >
        <BrandHeader
          subtitle={
            listing.user.isOfficialStore ? OFFICIAL_STORE_NAME : "Figuras de anime en Lima"
          }
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 960,
            marginTop: 36,
            flexShrink: 0,
            borderRadius: 48,
            background: "#ffffff",
            overflow: "hidden",
            boxShadow: "0 30px 60px rgba(0,0,0,0.25)",
          }}
        >
          <div
            style={{
              display: "flex",
              position: "relative",
              width: 960,
              height: 760,
              flexShrink: 0,
              alignItems: "center",
              justifyContent: "center",
              background: "#fff7ed",
            }}
          >
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photo}
                width={960}
                height={760}
                alt=""
                style={listing.sold ? { filter: "grayscale(100%)", objectFit: "cover" } : { objectFit: "cover" }}
              />
            ) : (
              <div style={{ display: "flex", fontSize: 72, fontWeight: 900, color: ORANGE }}>
                FigurasAnime
              </div>
            )}
            {listing.sold && (
              <div
                style={{
                  display: "flex",
                  position: "absolute",
                  inset: 0,
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(24,24,27,0.55)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    padding: "18px 56px",
                    borderRadius: 999,
                    background: INK,
                    color: "#ffffff",
                    fontSize: 64,
                    fontWeight: 900,
                    letterSpacing: 6,
                  }}
                >
                  VENDIDA
                </div>
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 22, padding: "36px 48px 44px" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <StoryPill background="#fee2e2" color="#b91c1c">
                {truncate(listing.category, 24)}
              </StoryPill>
              <StoryPill background="#eff6ff" color="#1d4ed8">
                {conditionLabel(listing.condition)}
              </StoryPill>
              {listing.isPreorder && !listing.sold && (
                <StoryPill background="#f5f3ff" color="#6d28d9">
                  Preventa
                </StoryPill>
              )}
              {reserved && (
                <StoryPill background="#e0f2fe" color="#0369a1">
                  Separada
                </StoryPill>
              )}
              {discount && (
                <StoryPill background="#dcfce7" color={GREEN}>
                  Oferta
                </StoryPill>
              )}
            </div>

            <div style={{ display: "flex", fontSize: 46, fontWeight: 700, lineHeight: 1.15, color: INK }}>
              {truncate(listing.title, 64)}
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: 22 }}>
              {discount && (
                <div
                  style={{
                    display: "flex",
                    fontSize: 44,
                    fontWeight: 500,
                    color: MUTED,
                    textDecoration: "line-through",
                  }}
                >
                  {formatPrice(listing.price)}
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  fontSize: 96,
                  fontWeight: 900,
                  color: listing.sold ? MUTED : discount ? GREEN : ORANGE,
                }}
              >
                {formatPrice(finalPrice)}
              </div>
            </div>

            <div style={{ display: "flex", fontSize: 32, fontWeight: 500, color: MUTED }}>
              {truncate(zoneText, 48)}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexShrink: 0, marginTop: 40 }}>
          <FooterCta text={listing.sold ? `Más figuras en ${SITE_HOST}` : `Pídela en ${SITE_HOST}`} />
        </div>
      </div>
    ),
    { ...STORY_SIZE, fonts }
  );
}

// ---------------------------------------------------------------------------
// Top de la semana (historia 1080×1920 o publicación 1080×1350)
// ---------------------------------------------------------------------------

export const POST_SIZE = { width: 1080, height: 1350 };

export type WeeklyFormat = "historia" | "post";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// Las figuras disponibles publicadas en los últimos 7 días; si son pocas, se
// completa con las más recientes para que la imagen nunca salga vacía.
export async function getWeeklyListings(limit: number) {
  const select = {
    id: true,
    title: true,
    price: true,
    discountAmount: true,
    discountExpiresAt: true,
    images: { take: 1, select: { url: true } },
  } as const;
  const recent = await prisma.listing.findMany({
    where: { sold: false, createdAt: { gte: new Date(Date.now() - WEEK_MS) } },
    orderBy: { createdAt: "desc" },
    take: limit,
    select,
  });
  if (recent.length >= limit) return recent;
  const more = await prisma.listing.findMany({
    where: { sold: false, id: { notIn: recent.map((l) => l.id) } },
    orderBy: { createdAt: "desc" },
    take: limit - recent.length,
    select,
  });
  return [...recent, ...more];
}

function weekLabel(now = new Date()): string {
  const from = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) =>
    d.toLocaleDateString("es-PE", { day: "numeric", month: "short", timeZone: "America/Lima" });
  return `Del ${fmt(from)} al ${fmt(now)}`;
}

export async function renderWeeklyImage(format: WeeklyFormat): Promise<ImageResponse> {
  const isStory = format === "historia";
  const size = isStory ? STORY_SIZE : POST_SIZE;
  const count = isStory ? 6 : 4;
  const cell = 450;
  const photoHeight = isStory ? 250 : 280;

  const [fonts, listings] = await Promise.all([fontsPromise, getWeeklyListings(count)]);
  const photos = await Promise.all(
    listings.map((l) => loadPhoto(l.images[0]?.url, cell, photoHeight))
  );

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          height: "100%",
          background: BACKGROUND,
          fontFamily: "Geist",
          padding: isStory ? "180px 60px 0" : "60px 60px 0",
        }}
      >
        <BrandHeader subtitle={weekLabel()} />
        <div
          style={{
            display: "flex",
            flexShrink: 0,
            marginTop: 16,
            fontSize: isStory ? 64 : 56,
            fontWeight: 900,
            color: "#ffffff",
          }}
        >
          Novedades de la semana
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 30,
            width: 960,
            flexShrink: 0,
            marginTop: isStory ? 36 : 36,
          }}
        >
          {listings.map((l, i) => {
            const discount = getActiveDiscountAmount(l.discountAmount, l.discountExpiresAt);
            return (
              <div
                key={l.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  width: cell,
                  borderRadius: 32,
                  overflow: "hidden",
                  background: "#ffffff",
                  boxShadow: "0 16px 32px rgba(0,0,0,0.2)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    width: cell,
                    height: photoHeight,
                    background: "#fff7ed",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  {photos[i] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photos[i]!} width={cell} height={photoHeight} alt="" style={{ objectFit: "cover" }} />
                  ) : (
                    <div style={{ display: "flex", fontSize: 40, fontWeight: 900, color: ORANGE }}>
                      FigurasAnime
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "16px 22px 20px" }}>
                  <div
                    style={{
                      display: "flex",
                      fontSize: 28,
                      fontWeight: 700,
                      color: INK,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                    }}
                  >
                    {truncate(l.title, 26)}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      fontSize: 46,
                      fontWeight: 900,
                      color: discount ? GREEN : ORANGE,
                    }}
                  >
                    {formatPrice(getFinalPrice(l.price, discount))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", flexShrink: 0, marginTop: 36 }}>
          <FooterCta text={`Míralas en ${SITE_HOST}`} />
        </div>
      </div>
    ),
    { ...size, fonts }
  );
}
