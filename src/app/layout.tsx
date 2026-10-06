import type { Metadata } from "next";
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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gerstore.club";

// Le dice a Google cuáles son las redes oficiales de la tienda.
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "FigurasAnime",
  url: SITE_URL,
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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "FigurasAnime — Compra y venta de figuras de anime",
  description:
    "Marketplace para comprar y vender figuras de anime (Naruto, Dragon Ball Z y más) contactando directo por WhatsApp.",
  other: {
    "google-adsense-account": "ca-pub-3110338196429688",
  },
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-zinc-50 text-zinc-900">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
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
