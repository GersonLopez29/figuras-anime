export const CATEGORIES = [
  "Naruto",
  "Dragon Ball Z",
  "One Piece",
  "Attack on Titan",
  "Demon Slayer",
  "My Hero Academia",
  "Pokemon",
  "Otras",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_ICONS: Record<Category, string> = {
  Naruto: "🍥",
  "Dragon Ball Z": "🐉",
  "One Piece": "🏴‍☠️",
  "Attack on Titan": "⚔️",
  "Demon Slayer": "🗡️",
  "My Hero Academia": "🦸",
  Pokemon: "⚡",
  Otras: "📦",
};
