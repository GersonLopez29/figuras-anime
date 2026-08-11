const regionNames = new Intl.DisplayNames(["es"], { type: "region" });

export function getCountryName(code: string) {
  if (!code || code === "XX") return "Desconocido";
  try {
    return regionNames.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}
