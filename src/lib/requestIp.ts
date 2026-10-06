// IP de quien hace la petición, para los límites por hora.
//
// Con IPv6 cada casa o celular recibe un bloque enorme de direcciones (/64) y
// puede cambiar de dirección cuando quiera, así que se usa el bloque completo:
// si no, alguien podría saltarse los límites rotando direcciones.
export function getClientIp(request: Request): string {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (!ip) return "unknown";
  return ip.includes(":") ? ipv6Block(ip) : ip;
}

function ipv6Block(ip: string): string {
  const [head, tail] = ip.toLowerCase().split("%")[0].split("::");
  const headParts = head ? head.split(":") : [];
  let parts = headParts;
  if (tail !== undefined) {
    const tailParts = tail ? tail.split(":") : [];
    const missing = Math.max(0, 8 - headParts.length - tailParts.length);
    parts = [...headParts, ...Array(missing).fill("0"), ...tailParts];
  }
  // IPv4 dentro de IPv6 (::ffff:1.2.3.4): se usa la IPv4.
  const last = parts[parts.length - 1] ?? "";
  if (last.includes(".")) return last;
  return `${parts.slice(0, 4).map((p) => p.replace(/^0+(?=.)/, "")).join(":")}::/64`;
}
