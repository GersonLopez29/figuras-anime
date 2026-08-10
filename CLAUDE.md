@AGENTS.md

# figuras-marketplace

Marketplace de figuras de anime. Next.js 16 (App Router), Prisma 7 + Postgres (Neon) vía `@prisma/adapter-pg`, Tailwind v4, Vercel Blob para imágenes, Resend para email, sesiones JWT (`jose`) en cookie httpOnly.

## UI: shadcn/ui

Todo el frontend (páginas + componentes) usa shadcn/ui (`src/components/ui/`), estilo `base-nova` sobre **Base UI** (no Radix — `@base-ui/react`, no `@radix-ui/react-*`). Color primario = naranja de marca (`--primary` en `src/app/globals.css`, alineado a `orange-600` en light / `orange-500` en dark).

Componentes instalados: button, card, dialog, alert-dialog, badge, input, label, select, textarea, tabs, dropdown-menu, sheet, skeleton, separator, avatar, alert, table.

Gotchas de Base UI encontrados al migrar (tenerlos en cuenta al tocar componentes nuevos):
- **`Button` renderizado como link**: si usás `render={<Link .../>}`, siempre pasar `nativeButton={false}`. Si no, Base UI tira un error en consola (asume que el `render` es un `<button>` nativo).
- **`SelectValue`**: no renderiza automáticamente los children del `SelectItem` seleccionado — solo muestra el `value` crudo. Si el item visible es distinto al value (ej. ícono + nombre, o un slug con label separado), hay que pasarle una children-function: `<SelectValue>{(v) => labelFor(v)}</SelectValue>`.
- **`Button`/`Badge` con texto largo en contenedores angostos**: la clase base trae `whitespace-nowrap`, así que el texto se corta en vez de wrappear. Agregar `whitespace-normal` explícito cuando el texto puede ser largo (pasó con un link "¿No encuentras tu categoría? Solicítala").
- **Borrado destructivo**: siempre `AlertDialog`, nunca `confirm()` ni `Dialog`. `AlertDialogAction` no cierra el diálogo solo (no está envuelto en `Close`) — hay que manejar `open`/`onOpenChange` a mano y cerrarlo en el handler tras la respuesta del fetch. Ver `DeleteListingButton.tsx` o `DeleteUserButton.tsx` (este último es el modal de "escribe el nombre para confirmar" del panel admin).
- **No anidar `Card` dentro de `Card`** — si un widget ya vive dentro de un Card padre, usar un panel simple (`bg-muted/50 rounded-lg`) en vez de otro Card.

## Seguridad

- `/api/cron/backup` guarda los respaldos **privados** en Vercel Blob (`access: "private"`) y excluye `passwordHash` del volcado de usuarios. Falla cerrado (401) si falta `CRON_SECRET`, en vez de omitir la verificación.
- `src/lib/session.ts` falla al firmar/verificar si falta `SESSION_SECRET` (sin fallback hardcodeado a un secreto público).
- `Review` tiene `@@unique([authorId, sellerId])` + `upsert` en el POST — un usuario no puede spamear reseñas contra el mismo vendedor.
- `src/lib/email.ts` escapa HTML de todo valor con contenido de usuario (nombre, comentario, categoría) antes de interpolarlo en las plantillas.
- Login usa `bcrypt.compare` contra un hash de relleno cuando el correo no existe (tiempo constante), y el registro no revela por HTTP si un correo ya está en uso — ambos para reducir enumeración de usuarios.
