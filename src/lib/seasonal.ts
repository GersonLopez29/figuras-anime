// Tema de temporada del sitio. Para apagar la decoración navideña, cambia
// el valor a null y vuelve a desplegar. Solo afecta la parte visual (nieve,
// luces, íconos); no toca precios, categorías ni ningún dato.
export const SEASONAL_THEME: "navidad" | null = "navidad";

export const isNavidadTheme = SEASONAL_THEME === "navidad";
