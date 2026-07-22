export const CATEGORIES = [
  "nourriture",
  "transport",
  "loyer",
  "santé",
  "éducation",
  "loisirs",
  "factures",
  "shopping",
  "autre",
] as const;

export type Category = (typeof CATEGORIES)[number];
