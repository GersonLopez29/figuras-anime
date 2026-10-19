// Contenido de un <script type="application/ld+json">. JSON.stringify no escapa
// "<", y la descripción la escribe el vendedor: un "</script>" en el texto
// cerraría la etiqueta y lo que siga se ejecutaría como código. Con < el
// JSON sigue siendo el mismo para Google pero el navegador no ve la etiqueta.
export function jsonLdHtml(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
