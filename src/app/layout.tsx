import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CursorTrail from "@/components/CursorTrail";
import EmailVerificationBanner from "@/components/EmailVerificationBanner";
import SuggestionButton from "@/components/SuggestionButton";
import { registerSiteVisit } from "@/lib/siteStats";
import { getCategories } from "@/lib/categories";
import { getCurrentUser } from "@/lib/session";
import { SOCIAL_LINKS } from "@/lib/social";
import { jsonLdHtml } from "@/lib/jsonLd";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gerstore.club";

// Modo oscuro: se aplica antes de pintar la página (sin destello blanco).
// Usa lo que la persona eligió con el botón ☀️/🌙; si nunca eligió, sigue la
// configuración de su celular o computadora.
const themeScript = `(function(){try{var t=localStorage.getItem("theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;if(d)document.documentElement.classList.add("dark");}catch(e){}})();`;

// Le dice a Google cuáles son las redes oficiales de la tienda.
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "GerStore",
  // Antes se llamaba FigurasAnime: así Google relaciona el nombre anterior.
  alternateName: ["gerstore.club", "FigurasAnime"],
  url: SITE_URL,
  logo: `${SITE_URL}/icons/icon-512.png`,
  description: "Marketplace de figuras de anime en Lima y todo el Perú.",
  sameAs: SOCIAL_LINKS.map((s) => s.url),
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Color de la barra del navegador y de la app instalada (naranja de la marca).
export const viewport: Viewport = {
  themeColor: "#ea580c",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // Portada (y páginas sin título propio). "Perú" y "Lima" son como busca la
  // gente: "figuras anime lima", "figuras de anime perú".
  title: "Figuras de anime en Perú: compra y venta en Lima | GerStore",
  description:
    "Compra y vende figuras de anime en Lima y todo el Perú: S.H.Figuarts, Ichiban Kuji, Banpresto y más de Dragon Ball, Naruto y One Piece, directo por WhatsApp.",
  openGraph: {
    siteName: "GerStore",
    locale: "es_PE",
    type: "website",
  },
  other: {
    "google-adsense-account": "ca-pub-3110338196429688",
  },
  // En iPhone, la app instalada usa este nombre bajo el ícono.
  appleWebApp: { capable: true, title: "GerStore", statusBarStyle: "default" },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [totalVisits, categories, user] = await Promise.all([
    registerSiteVisit(),
    getCategories(),
    getCurrentUser(),
  ]);

  return (
    <html
      lang="es"
      // El script de abajo agrega la clase "dark" antes de que React cargue.
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col bg-zinc-50 text-foreground dark:bg-background">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdHtml(organizationJsonLd) }}
        />
        <CursorTrail />
        <Navbar />
        {user && !user.emailVerified && <EmailVerificationBanner />}
        <main className="flex-1">{children}</main>
        <Footer totalVisits={totalVisits} categories={categories} />
        <SuggestionButton />
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3110338196429688"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
