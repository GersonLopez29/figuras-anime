import type { Metadata } from "next";

// Título (y si Google la indexa o no) de esta página.
export const metadata: Metadata = {
  title: "Crea tu cuenta gratis y vende tus figuras de anime | FigurasAnime",
  description:
    "Regístrate gratis en FigurasAnime para publicar tus figuras de anime en Lima y todo el Perú: tu primera figura sale destacada 7 días.",
  alternates: { canonical: "/registro" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
