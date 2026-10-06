import { ImageResponse } from "next/og";
import { join } from "node:path";
import { readFile } from "node:fs/promises";
import { prisma } from "@/lib/db";
import { formatPrice, getActiveDiscountAmount, getFinalPrice } from "@/lib/format";
import { isNewCondition, isOpenBoxCondition } from "@/lib/condition";
import { getDeliveryZoneLabel, sortDeliveryZones } from "@/lib/delivery";
import { OFFICIAL_STORE_NAME } from "@/lib/store";
import { getActiveReservation } from "@/lib/reservation";

// Imagen de vista previa (1200×630) que muestran WhatsApp, Facebook, X, etc.
// al compartir una figura: foto, título, precio, estado, zona y la marca.

export const SHARE_IMAGE_SIZE = { width: 1200, height: 630 };
export const SHARE_IMAGE_ALT = "Figura en venta en FigurasAnime";

const PHOTO_SIZE = 630;
const SITE_HOST = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://gerstore.club").replace(
  /^https?:\/\//,
  ""
);

const ORANGE = "#ea580c";
const RED = "#dc2626";
const GREEN = "#15803d";
const INK = "#18181b";
const MUTED = "#71717a";

// Geist (licencia OFL, ver assets/fonts/OFL-Geist.txt). Se lee una sola vez.
const fontsPromise = Promise.all(
  [
    { file: "Geist-Medium.ttf", weight: 500 as const },
    { file: "Geist-Bold.ttf", weight: 700 as const },
    { file: "Geist-Black.ttf", weight: 900 as const },
  ].map(async ({ file, weight }) => ({
    name: "Geist",
    data: await readFile(join(process.cwd(), "assets/fonts", file)),
    weight,
    style: "normal" as const,
  }))
);

// Baja la foto de la figura y la deja como JPEG cuadrado de 630 px. Se pasa por
// sharp porque el generador de imágenes no lee WebP y las fotos del celular
// pueden pesar varios MB. Si algo falla, la imagen se arma sin foto.
async function loadPhoto(url: string | undefined): Promise<string | null> {
  if (!url) return null;
  try {
    let buffer: Buffer;
    if (url.startsWith("/")) {
      // Desarrollo local sin Vercel Blob: las fotos viven en /public.
      buffer = await readFile(join(process.cwd(), "public", url));
    } else {
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) return null;
      buffer = Buffer.from(await res.arrayBuffer());
    }
    const sharp = (await import("sharp")).default;
    const jpeg = await sharp(buffer)
      .rotate()
      .resize(PHOTO_SIZE, PHOTO_SIZE, { fit: "cover" })
      .jpeg({ quality: 80 })
      .toBuffer();
    return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  } catch (err) {
    console.error("[share-image] No se pudo cargar la foto:", err);
    return null;
  }
}

function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
}

function conditionLabel(condition: string): string {
  if (isNewCondition(condition)) return "Nueva";
  if (isOpenBoxCondition(condition)) return "Open box";
  return "Usada";
}

function Pill({ children, background, color }: { children: string; background: string; color: string }) {
  return (
    <div
      style={{
        display: "flex",
        padding: "6px 16px",
        borderRadius: 999,
        background,
        color,
        fontSize: 22,
        fontWeight: 700,
      }}
    >
      {children}
    </div>
  );
}

function Brand() {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
      <div style={{ display: "flex", fontSize: 36, fontWeight: 900, color: ORANGE }}>
        FigurasAnime
      </div>
      <div style={{ display: "flex", fontSize: 22, fontWeight: 500, color: MUTED }}>{SITE_HOST}</div>
    </div>
  );
}

function fallbackImage(fonts: Awaited<typeof fontsPromise>) {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #fff7ed 0%, #ffffff 55%, #fef2f2 100%)",
          fontFamily: "Geist",
          gap: 20,
        }}
      >
        <div style={{ display: "flex", fontSize: 84, fontWeight: 900, color: ORANGE }}>
          FigurasAnime
        </div>
        <div style={{ display: "flex", fontSize: 34, fontWeight: 500, color: INK }}>
          Compra y vende figuras de anime en Lima
        </div>
      </div>
    ),
    { ...SHARE_IMAGE_SIZE, fonts }
  );
}

export async function renderListingShareImage(id: string): Promise<ImageResponse> {
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

  if (!listing) return fallbackImage(fonts);

  const photo = await loadPhoto(listing.images[0]?.url);
  const discount = listing.sold
    ? null
    : getActiveDiscountAmount(listing.discountAmount, listing.discountExpiresAt);
  const finalPrice = getFinalPrice(listing.price, discount);
  const zones = sortDeliveryZones(listing.deliveryZones).map(getDeliveryZoneLabel);
  const zoneText =
    zones.length === 0
      ? "Entrega en Lima"
      : `Entrega: ${zones.slice(0, 2).join(" · ")}${zones.length > 2 ? ` +${zones.length - 2}` : ""}`;
  const sellerText = listing.user.isOfficialStore
    ? OFFICIAL_STORE_NAME
    : `Vende: ${truncate(listing.user.name.split(" ")[0], 14)}`;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "#ffffff",
          fontFamily: "Geist",
        }}
      >
        {/* Foto */}
        <div
          style={{
            display: "flex",
            position: "relative",
            width: PHOTO_SIZE,
            height: PHOTO_SIZE,
            background: "linear-gradient(135deg, #ffedd5 0%, #fee2e2 100%)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              width={PHOTO_SIZE}
              height={PHOTO_SIZE}
              alt=""
              // El generador falla con valores de estilo undefined: solo se
              // agrega el filtro cuando hace falta.
              style={listing.sold ? { filter: "grayscale(100%)" } : {}}
            />
          ) : (
            <div style={{ display: "flex", fontSize: 64, fontWeight: 900, color: ORANGE }}>
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
                background: "rgba(24, 24, 27, 0.55)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  padding: "14px 40px",
                  borderRadius: 999,
                  background: INK,
                  color: "#ffffff",
                  fontSize: 44,
                  fontWeight: 900,
                  letterSpacing: 4,
                }}
              >
                VENDIDA
              </div>
            </div>
          )}
        </div>

        {/* Datos */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: 1200 - PHOTO_SIZE,
            padding: "44px 48px",
            borderTop: `10px solid ${ORANGE}`,
          }}
        >
          <Brand />

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <Pill background={RED} color="#ffffff">
                {truncate(listing.category, 22)}
              </Pill>
              <Pill background="#eff6ff" color="#1d4ed8">
                {conditionLabel(listing.condition)}
              </Pill>
              {!listing.sold && getActiveReservation(listing.reservedAmount, listing.reservedUntil) && (
                <Pill background="#e0f2fe" color="#0369a1">
                  Separada
                </Pill>
              )}
              {listing.isPreorder && !listing.sold && (
                <Pill background="#f5f3ff" color="#6d28d9">
                  Preventa
                </Pill>
              )}
              {discount && (
                <Pill background="#dcfce7" color={GREEN}>
                  Oferta
                </Pill>
              )}
            </div>

            <div
              style={{
                display: "flex",
                fontSize: 38,
                fontWeight: 700,
                lineHeight: 1.15,
                color: INK,
              }}
            >
              {truncate(listing.title, 58)}
            </div>

            {discount ? (
              <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
                <div
                  style={{
                    display: "flex",
                    fontSize: 30,
                    fontWeight: 500,
                    color: MUTED,
                    textDecoration: "line-through",
                  }}
                >
                  {formatPrice(listing.price)}
                </div>
                <div style={{ display: "flex", fontSize: 68, fontWeight: 900, color: GREEN }}>
                  {formatPrice(finalPrice)}
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  fontSize: 68,
                  fontWeight: 900,
                  color: listing.sold ? MUTED : ORANGE,
                }}
              >
                {formatPrice(listing.price)}
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", fontSize: 24, fontWeight: 500, color: MUTED }}>
              {truncate(zoneText, 42)}
            </div>
            <div
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}
            >
              <div
                style={{
                  display: "flex",
                  flexShrink: 1,
                  overflow: "hidden",
                  fontSize: 24,
                  fontWeight: 700,
                  color: INK,
                  whiteSpace: "nowrap",
                }}
              >
                {sellerText}
              </div>
              <div
                style={{
                  display: "flex",
                  padding: "10px 22px",
                  borderRadius: 999,
                  background: listing.sold ? MUTED : "#16a34a",
                  color: "#ffffff",
                  fontSize: 24,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {listing.sold ? "Ver similares" : "Ver y contactar"}
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...SHARE_IMAGE_SIZE, fonts }
  );
}
