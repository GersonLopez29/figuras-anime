// Redes sociales oficiales de la tienda.
export const SOCIAL_LINKS = [
  { network: "facebook", name: "Facebook", handle: "StoreGerson", url: "https://www.facebook.com/StoreGerson/" },
  { network: "tiktok", name: "TikTok", handle: "@gerstore.club", url: "https://www.tiktok.com/@gerstore.club" },
] as const;

export type SocialNetwork = (typeof SOCIAL_LINKS)[number]["network"];
