import type { Metadata } from "next";

// Título (y si Google la indexa o no) de esta página.
export const metadata: Metadata = {
  title: "Nueva contraseña — FigurasAnime",
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
