export type Product = {
  id: string;
  name: string;
  price: number; // whole dollars
  emoji: string;
  blurb: string;
  badge?: string;
};

// The shop's menu, straight from Ellie & Grace's price sign.
export const PRODUCTS: Product[] = [
  {
    id: "fishtail",
    name: "Fishtail Bracelet",
    price: 4,
    emoji: "🐟",
    blurb: "Our coolest, twistiest design.",
    badge: "Most popular",
  },
  {
    id: "keychain",
    name: "Keychain",
    price: 4,
    emoji: "🔑",
    blurb: "Clip it to your bag, keys, or backpack.",
  },
  {
    id: "choker",
    name: "Choker",
    price: 3,
    emoji: "💜",
    blurb: "A pretty necklace-style band.",
  },
  {
    id: "bracelet",
    name: "Plain Bracelet",
    price: 2,
    emoji: "🌈",
    blurb: "Simple, comfy, and colorful.",
  },
  {
    id: "ring",
    name: "Ring",
    price: 2,
    emoji: "💍",
    blurb: "A tiny loop of rainbow.",
  },
  {
    id: "custom",
    name: "Custom Made",
    price: 5,
    emoji: "✨",
    blurb: "You pick it! Any colors, initials, hearts or flowers.",
    badge: "Made just for you",
  },
];

export const PRODUCTS_BY_ID: Record<string, Product> = Object.fromEntries(
  PRODUCTS.map((p) => [p.id, p]),
);
