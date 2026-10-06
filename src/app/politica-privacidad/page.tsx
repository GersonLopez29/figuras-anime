import type { Metadata } from "next";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Política de Privacidad — FigurasAnime",
  description:
    "Cómo FigurasAnime recopila, usa y protege tus datos personales al comprar, vender y publicar figuras de anime.",
};

const LAST_UPDATED = "6 de octubre de 2026";
const CONTACT_EMAIL = "gersonownd@gmail.com";

export default function PoliticaPrivacidadPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold text-foreground">Política de Privacidad y Tratamiento de Datos</h1>
      <p className="mt-2 text-sm text-muted-foreground">Última actualización: {LAST_UPDATED}</p>

      <Card className="mt-6 p-6 shadow-sm sm:p-8">
        <div className="space-y-8 text-sm leading-relaxed text-foreground/90">
          <section>
            <p>
              Esta política explica qué datos personales recopila FigurasAnime (
              <span className="font-medium">gerstore.club</span>), para qué los usamos, con quién los
              compartimos y qué derechos tienes sobre ellos. Al crear una cuenta o usar el marketplace,
              aceptas el tratamiento de tus datos descrito aquí.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">1. Qué datos recopilamos</h2>
            <h3 className="mt-4 text-sm font-semibold text-foreground">Al crear tu cuenta</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>Nombre</li>
              <li>Correo electrónico</li>
              <li>Contraseña — nunca se guarda en texto plano, solo un hash irreversible (bcrypt)</li>
              <li>Número de WhatsApp — es el dato que usan los compradores para contactarte</li>
            </ul>

            <h3 className="mt-4 text-sm font-semibold text-foreground">Al usar la plataforma</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>Fotos y descripciones de las figuras que publicas</li>
              <li>Mensajes que envías a otros usuarios dentro del chat de la plataforma</li>
              <li>Reseñas y calificaciones que dejas a otros vendedores</li>
              <li>Tus favoritos y publicaciones que visitas</li>
            </ul>

            <h3 className="mt-4 text-sm font-semibold text-foreground">Automáticamente</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>
                Dirección IP — se usa solo para limitar intentos de inicio de sesión, registro de cuentas y
                consultas de contacto por WhatsApp, y prevenir spam y accesos indebidos. No se usa para identificarte ni se comparte con
                terceros.
              </li>
              <li>
                Datos de uso agregados (páginas vistas, rendimiento) a través de Vercel Analytics y Speed
                Insights — no se vinculan a tu identidad ni se usan con fines publicitarios.
              </li>
              <li>
                Una cookie de sesión técnica (httpOnly, no accesible desde JavaScript) que solo sirve para
                mantenerte con la sesión iniciada.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">2. Para qué usamos tus datos</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>Operar tu cuenta y mostrar tus publicaciones en el catálogo</li>
              <li>
                Permitir que los interesados te contacten por WhatsApp (tengan cuenta o no) o por el chat
                interno (usuarios registrados) sobre una figura que publicaste
              </li>
              <li>Enviarte correos necesarios para el servicio: verificación de cuenta y avisos de seguridad</li>
              <li>
                Prevenir fraude, spam y accesos no autorizados (por ejemplo, bloqueo temporal tras varios
                intentos fallidos de inicio de sesión)
              </li>
              <li>Mostrarte estadísticas básicas de tus propias publicaciones (número de vistas)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">3. Con quién compartimos tus datos</h2>
            <p className="mt-2 text-muted-foreground">
              Tu nombre se muestra en tus publicaciones. Tu número de WhatsApp no aparece escrito en la
              página: se entrega a la persona que toca &quot;Contactar por WhatsApp&quot; en una figura tuya,
              tenga cuenta o no, para que pueda escribirte. Limitamos cuántas consultas puede hacer cada
              conexión por hora para evitar que se recolecten números de forma automática.
            </p>
            <p className="mt-2 text-muted-foreground">
              Usamos proveedores externos que procesan datos en nuestro nombre, bajo sus propias políticas
              de seguridad:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>Vercel — hosting, base de datos y almacenamiento de las imágenes que subes</li>
              <li>Resend — envío de los correos transaccionales del servicio</li>
            </ul>
            <p className="mt-2 text-muted-foreground">
              No vendemos ni compartimos tus datos con terceros con fines publicitarios.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">4. Cómo protegemos tus datos</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>Contraseñas almacenadas solo como hash (bcrypt), nunca en texto plano</li>
              <li>Toda la comunicación con el sitio va cifrada (HTTPS)</li>
              <li>Bloqueo temporal de la cuenta tras varios intentos fallidos de inicio de sesión</li>
              <li>El panel de administración solo es accesible para cuentas con rol de administrador</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">5. Tus derechos</h2>
            <p className="mt-2 text-muted-foreground">
              Puedes solicitar en cualquier momento: acceder a los datos que tenemos sobre ti, corregirlos si
              están desactualizados, eliminar tu cuenta y tus datos, u oponerte a un uso específico de tu
              información. Para ejercer cualquiera de estos derechos, escríbenos a{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-primary hover:underline">
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">6. Menores de edad</h2>
            <p className="mt-2 text-muted-foreground">
              FigurasAnime no está dirigido a menores de edad y no recopilamos deliberadamente datos de
              menores. Si detectamos una cuenta de un menor, la eliminaremos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">7. Cambios a esta política</h2>
            <p className="mt-2 text-muted-foreground">
              Podemos actualizar esta política cuando cambie cómo tratamos tus datos. La fecha de la última
              actualización siempre aparece al inicio de esta página.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">8. Contacto</h2>
            <p className="mt-2 text-muted-foreground">
              Para cualquier consulta sobre esta política o el tratamiento de tus datos, escríbenos a{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-primary hover:underline">
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </section>
        </div>
      </Card>
    </div>
  );
}
