// Sugiere una categoría a partir del título de la publicación, para que menos
// figuras terminen en "Otras" por error. Solo sugiere: el vendedor decide.

// Personajes y palabras frecuentes que no siempre traen el nombre de la serie.
const SERIES_KEYWORDS: { series: string[]; keywords: string[] }[] = [
  {
    series: ["dragon ball"],
    keywords: [
      "dragon ball", "goku", "vegeta", "gohan", "trunks", "goten", "broly", "bardock",
      "freezer", "frieza", "majin buu", "piccolo", "zarbon", "androide", "android",
      "cell", "krillin", "pan gt", "vegetto", "gogeta", "beerus", "dbz",
    ],
  },
  {
    series: ["one piece"],
    keywords: ["one piece", "luffy", "zoro", "sanji", "nami", "garp", "shanks", "usopp", "chopper", "ace"],
  },
  {
    series: ["naruto"],
    keywords: ["naruto", "sasuke", "kakashi", "itachi", "madara", "jiraiya", "boruto", "akatsuki"],
  },
  {
    series: ["demon slayer", "kimetsu"],
    keywords: ["demon slayer", "kimetsu", "nezuko", "tanjiro", "zenitsu", "inosuke", "rengoku"],
  },
  {
    series: ["attack on titan", "shingeki"],
    keywords: ["attack on titan", "shingeki", "eren", "levi", "mikasa"],
  },
  {
    series: ["my hero", "boku no hero"],
    keywords: ["my hero", "boku no hero", "deku", "bakugo", "all might", "todoroki"],
  },
  {
    series: ["pokemon", "pokémon"],
    keywords: ["pokemon", "pokémon", "pikachu", "charizard"],
  },
  {
    series: ["power ranger", "powerranger"],
    keywords: ["power ranger", "powerranger", "megazord", "ranger"],
  },
  {
    series: ["harry potter"],
    keywords: ["harry potter", "hogwarts", "dobby", "hermione", "dumbledore", "voldemort"],
  },
  {
    series: ["samurai x", "rurouni kenshin"],
    keywords: ["samurai x", "rurouni", "kenshin"],
  },
  {
    series: ["marvel"],
    keywords: ["marvel", "spiderman", "spider-man", "punisher", "wolverine", "iron man", "avengers", "x-men"],
  },
];

function normalize(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Coincidencia por palabra completa: "cell" no debe encontrar "cellophane".
function mentions(title: string, phrase: string): boolean {
  return new RegExp(`(^|[^a-z0-9])${escapeRegExp(phrase)}([^a-z0-9]|$)`).test(title);
}

const GENERIC_CATEGORIES = ["otras", "otros"];

export function suggestCategory(title: string, categoryNames: string[]): string | null {
  const t = normalize(title);
  if (t.length < 3) return null;

  // 1) El título menciona directamente el nombre de una categoría (o la parte
  //    entre paréntesis, ej. "Samurai X (Rurouni Kenshin)").
  for (const name of categoryNames) {
    if (GENERIC_CATEGORIES.includes(normalize(name))) continue;
    const parts = name
      .split(/[()/]/)
      .map(normalize)
      .filter((p) => p.length >= 3);
    if (parts.some((p) => mentions(t, p))) return name;
  }

  // 2) El título menciona un personaje conocido de una serie que tiene categoría.
  for (const { series, keywords } of SERIES_KEYWORDS) {
    const category = categoryNames.find((name) =>
      series.some((s) => normalize(name).includes(normalize(s)))
    );
    if (category && keywords.some((k) => mentions(t, normalize(k)))) return category;
  }

  return null;
}
