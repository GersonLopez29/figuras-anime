const regionNames = new Intl.DisplayNames(["es"], { type: "region" });

export function getCountryName(code: string) {
  if (!code || code === "XX") return "Desconocido";
  try {
    return regionNames.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

export function getCountryFlag(code: string) {
  if (!code || code.length !== 2 || code === "XX") return "🌐";
  const points = [...code.toUpperCase()].map((c) => 127397 + c.charCodeAt(0));
  return String.fromCodePoint(...points);
}
