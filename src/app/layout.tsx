import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CursorTrail from "@/components/CursorTrail";
import { registerSiteVisit } from "@/lib/siteStats";
import { getCategories } from "@/lib/categories";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FigurasAnime — Compra y venta de figuras de anime",
  description:
    "Marketplace para comprar y vender figuras de anime (Naruto, Dragon Ball Z y más) contactando directo por WhatsApp.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [totalVisits, categories] = await Promise.all([registerSiteVisit(), getCategories()]);

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-zinc-50 text-zinc-900">
        <CursorTrail />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer totalVisits={totalVisits} categories={categories} />
      </body>
    </html>
  );
}
