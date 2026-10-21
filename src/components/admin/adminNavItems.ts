import type { LucideIcon } from "lucide-react";
import {
  Bot,
  ChartColumn,
  Clapperboard,
  Handshake,
  LayoutDashboard,
  MessageCircle,
  MessagesSquare,
  Package,
  Share2,
  Star,
  Tags,
  TrendingUp,
  Users,
} from "lucide-react";

// Secciones del panel de administrador, agrupadas por tema. Lo usan la barra
// lateral (computadora) y el menú del celular.

export type AdminNavItem = {
  href: string;
  label: string;
  // Una línea que se muestra en el menú del celular.
  description: string;
  icon: LucideIcon;
};

export type AdminNavGroup = { title: string; items: AdminNavItem[] };

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    title: "General",
    items: [
      { href: "/admin", label: "Inicio", description: "Pendientes y resumen del día", icon: LayoutDashboard },
      { href: "/admin/estadisticas", label: "Estadísticas", description: "Visitas por día y por país", icon: ChartColumn },
    ],
  },
  {
    title: "Ventas",
    items: [
      { href: "/admin/destacados", label: "Destacados", description: "Aprobar pagos y ver destacadas", icon: Star },
      { href: "/admin/consignaciones", label: "Te la vendemos", description: "Figuras que nos piden vender", icon: Handshake },
      { href: "/admin/contactos", label: "Contactos", description: "Clics en WhatsApp y ofertas", icon: MessageCircle },
    ],
  },
  {
    title: "Catálogo",
    items: [
      { href: "/admin/publicaciones", label: "Publicaciones", description: "Todas las figuras publicadas", icon: Package },
      { href: "/admin/categorias", label: "Categorías", description: "Solicitudes y lista de categorías", icon: Tags },
      { href: "/admin/demanda", label: "Demanda", description: "Lo que más buscan y piden", icon: TrendingUp },
    ],
  },
  {
    title: "Personas",
    items: [
      { href: "/admin/usuarios", label: "Usuarios", description: "Cuentas, bloqueos y verificación", icon: Users },
      { href: "/admin/comunidad", label: "Comunidad", description: "Publicaciones y reportes", icon: MessagesSquare },
      { href: "/admin/asistente", label: "Asistente", description: "Qué le preguntan al chat", icon: Bot },
    ],
  },
  {
    title: "Marketing",
    items: [
      { href: "/admin/redes", label: "Imágenes para redes", description: "Novedades de la semana y catálogos", icon: Share2 },
      { href: "/admin/videos", label: "Videos TikTok", description: "Video anime de una figura", icon: Clapperboard },
    ],
  },
];

export const ADMIN_NAV_ITEMS = ADMIN_NAV.flatMap((g) => g.items);

export function isActiveAdminHref(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}
