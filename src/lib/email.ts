import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
const FROM = process.env.RESEND_FROM_EMAIL ?? "FigurasAnime <onboarding@resend.dev>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gerstore.club";

async function sendEmail(to: string, subject: string, html: string) {
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY no configurado, se omite el envío a ${to}: "${subject}"`);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to, subject, html });
  } catch (err) {
    console.error(`[email] Falló el envío a ${to}:`, err);
  }
}

function wrapper(title: string, bodyHtml: string) {
  return `
    <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <p style="font-size: 20px; font-weight: 800; color: #c2410c; margin: 0 0 16px;">🎌 FigurasAnime</p>
      <h1 style="font-size: 18px; color: #18181b; margin: 0 0 12px;">${title}</h1>
      ${bodyHtml}
      <p style="margin-top: 32px; font-size: 12px; color: #a1a1aa;">
        Marketplace de compra y venta de figuras de anime.
      </p>
    </div>
  `;
}

export async function sendVerificationEmail(to: string, name: string, token: string) {
  const verifyUrl = `${SITE_URL}/verificar-email?token=${token}`;
  await sendEmail(
    to,
    "Confirma tu correo en FigurasAnime",
    wrapper(
      `¡Hola ${escapeHtml(name)}!`,
      `
        <p style="font-size: 14px; color: #3f3f46; line-height: 1.6;">
          Gracias por registrarte en FigurasAnime. Confirma tu correo para activar tu cuenta:
        </p>
        <a href="${verifyUrl}" style="display: inline-block; margin-top: 12px; background: #ea580c; color: white; padding: 10px 20px; border-radius: 999px; text-decoration: none; font-weight: 600; font-size: 14px;">
          Confirmar mi correo
        </a>
        <p style="margin-top: 16px; font-size: 12px; color: #71717a;">
          Si el botón no funciona, copia este enlace: ${verifyUrl}
        </p>
      `
    )
  );
}

export async function sendAccountExistsEmail(to: string, name: string) {
  await sendEmail(
    to,
    "Ya tienes una cuenta en FigurasAnime",
    wrapper(
      `¡Hola ${escapeHtml(name)}!`,
      `
        <p style="font-size: 14px; color: #3f3f46; line-height: 1.6;">
          Alguien intentó crear una cuenta en FigurasAnime usando este correo, pero ya tienes una.
          Si fuiste tú, simplemente inicia sesión con tu contraseña habitual.
        </p>
        <a href="${SITE_URL}/login" style="display: inline-block; margin-top: 12px; background: #ea580c; color: white; padding: 10px 20px; border-radius: 999px; text-decoration: none; font-weight: 600; font-size: 14px;">
          Iniciar sesión
        </a>
        <p style="margin-top: 16px; font-size: 12px; color: #71717a;">
          Si no fuiste tú, puedes ignorar este correo.
        </p>
      `
    )
  );
}

export async function sendCategoryRequestResolvedEmail(
  to: string,
  name: string,
  categoryName: string,
  approved: boolean
) {
  await sendEmail(
    to,
    approved
      ? `Tu categoría "${categoryName}" fue agregada`
      : `Tu solicitud de categoría "${categoryName}" fue rechazada`,
    wrapper(
      approved ? "¡Buenas noticias!" : "Sobre tu solicitud",
      `
        <p style="font-size: 14px; color: #3f3f46; line-height: 1.6;">
          Hola ${escapeHtml(name)}, tu solicitud para la categoría <strong>${escapeHtml(categoryName)}</strong>
          ${approved
            ? "fue aprobada y ya está disponible para todos los vendedores."
            : "fue rechazada por el administrador."}
        </p>
        <a href="${SITE_URL}/publicar" style="display: inline-block; margin-top: 12px; background: #ea580c; color: white; padding: 10px 20px; border-radius: 999px; text-decoration: none; font-weight: 600; font-size: 14px;">
          Ir a publicar
        </a>
      `
    )
  );
}

export async function sendNewReviewEmail(
  to: string,
  sellerName: string,
  reviewerName: string,
  rating: number,
  comment: string,
  sellerId: string
) {
  const stars = "⭐".repeat(Math.max(1, Math.min(5, Math.round(rating))));
  await sendEmail(
    to,
    `${reviewerName} te dejó una reseña en FigurasAnime`,
    wrapper(
      `¡Hola ${escapeHtml(sellerName)}!`,
      `
        <p style="font-size: 14px; color: #3f3f46; line-height: 1.6;">
          <strong>${escapeHtml(reviewerName)}</strong> te dejó una nueva reseña:
        </p>
        <p style="font-size: 16px; margin: 8px 0;">${stars}</p>
        <p style="font-size: 14px; color: #3f3f46; font-style: italic;">"${escapeHtml(comment)}"</p>
        <a href="${SITE_URL}/vendedor/${sellerId}" style="display: inline-block; margin-top: 12px; background: #ea580c; color: white; padding: 10px 20px; border-radius: 999px; text-decoration: none; font-weight: 600; font-size: 14px;">
          Ver mi perfil
        </a>
      `
    )
  );
}

export async function sendPasswordResetEmail(to: string, name: string, token: string) {
  const resetUrl = `${SITE_URL}/restablecer-password?token=${token}`;
  await sendEmail(
    to,
    "Restablece tu contraseña en FigurasAnime",
    wrapper(
      `¡Hola ${escapeHtml(name)}!`,
      `
        <p style="font-size: 14px; color: #3f3f46; line-height: 1.6;">
          Recibimos una solicitud para restablecer tu contraseña. Si fuiste tú, elige una nueva:
        </p>
        <a href="${resetUrl}" style="display: inline-block; margin-top: 12px; background: #ea580c; color: white; padding: 10px 20px; border-radius: 999px; text-decoration: none; font-weight: 600; font-size: 14px;">
          Restablecer contraseña
        </a>
        <p style="margin-top: 16px; font-size: 12px; color: #71717a;">
          Este enlace vence en 1 hora. Si no fuiste tú, puedes ignorar este correo — tu contraseña actual seguirá funcionando.
        </p>
      `
    )
  );
}

const SUGGESTIONS_INBOX = "gersonownd@gmail.com";

export async function sendSuggestionEmail(message: string, fromName?: string, fromEmail?: string) {
  await sendEmail(
    SUGGESTIONS_INBOX,
    fromName ? `Sugerencia de ${fromName}` : "Nueva sugerencia en FigurasAnime",
    wrapper(
      "💡 Nueva sugerencia",
      `
        <p style="font-size: 14px; color: #3f3f46; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(message)}</p>
        <p style="margin-top: 16px; font-size: 12px; color: #71717a;">
          De: ${escapeHtml(fromName || "Anónimo")}${fromEmail ? ` — ${escapeHtml(fromEmail)}` : ""}
        </p>
      `
    )
  );
}

// Los avisos para el administrador (destacados, consignaciones) llegan a la
// misma bandeja que las sugerencias.
const ADMIN_INBOX = SUGGESTIONS_INBOX;

function button(href: string, label: string) {
  return `<a href="${href}" style="display: inline-block; margin-top: 12px; background: #ea580c; color: white; padding: 10px 20px; border-radius: 999px; text-decoration: none; font-weight: 600; font-size: 14px;">${label}</a>`;
}

export async function sendFeatureRequestAdminEmail(
  sellerName: string,
  listingTitle: string,
  amount: number
) {
  await sendEmail(
    ADMIN_INBOX,
    `⭐ ${sellerName} pidió destacar una figura (S/ ${amount})`,
    wrapper(
      "⭐ Nueva solicitud para destacar",
      `
        <p style="font-size: 14px; color: #3f3f46; line-height: 1.6;">
          <strong>${escapeHtml(sellerName)}</strong> dice que pagó <strong>S/ ${amount}</strong>
          para destacar <strong>${escapeHtml(listingTitle)}</strong>.
          Revisa tu Yape o Plin y apruébala en el panel.
        </p>
        ${button(`${SITE_URL}/admin/destacados`, "Ir a destacados")}
      `
    )
  );
}

export async function sendFeatureRequestResolvedEmail(
  to: string,
  name: string,
  listingTitle: string,
  listingId: string,
  approved: boolean,
  untilLabel?: string
) {
  await sendEmail(
    to,
    approved
      ? `⭐ Tu figura "${listingTitle}" ya está destacada`
      : `Sobre tu solicitud para destacar "${listingTitle}"`,
    wrapper(
      approved ? "¡Tu figura ya está destacada!" : "Sobre tu solicitud",
      `
        <p style="font-size: 14px; color: #3f3f46; line-height: 1.6;">
          Hola ${escapeHtml(name)},
          ${
            approved
              ? `<strong>${escapeHtml(listingTitle)}</strong> ya aparece entre las destacadas del catálogo${
                  untilLabel ? ` hasta el ${escapeHtml(untilLabel)}` : ""
                }.`
              : `no pudimos confirmar el pago para destacar <strong>${escapeHtml(listingTitle)}</strong>. Si ya pagaste, escríbenos por WhatsApp con la captura.`
          }
        </p>
        ${button(`${SITE_URL}/figura/${listingId}`, "Ver mi figura")}
      `
    )
  );
}

export async function sendConsignmentRequestAdminEmail(
  userName: string,
  userWhatsapp: string,
  figure: string,
  details: string,
  expectedPrice: number | null
) {
  await sendEmail(
    ADMIN_INBOX,
    `📦 ${userName} quiere que vendas su figura: ${figure}`,
    wrapper(
      "📦 Nueva solicitud de consignación",
      `
        <p style="font-size: 14px; color: #3f3f46; line-height: 1.6;">
          <strong>${escapeHtml(userName)}</strong> (WhatsApp ${escapeHtml(userWhatsapp)}) quiere que vendas:
        </p>
        <p style="font-size: 15px; font-weight: 600; color: #18181b;">${escapeHtml(figure)}</p>
        <p style="font-size: 14px; color: #3f3f46; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(details)}</p>
        ${expectedPrice !== null ? `<p style="font-size: 14px; color: #3f3f46;">Precio esperado: <strong>S/ ${expectedPrice}</strong></p>` : ""}
        ${button(`${SITE_URL}/admin/consignaciones`, "Ver solicitudes")}
      `
    )
  );
}
