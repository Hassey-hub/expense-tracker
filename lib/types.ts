export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  category: string;
  description: string | null;
  source: "web" | "telegram";
  expense_date: string; // YYYY-MM-DD
  created_at: string;
}

export const CATEGORY_COLORS: Record<string, string> = {
  nourriture: "#0F6B4C",
  transport: "#D4A017",
  loyer: "#3B453F",
  santé: "#DC2626",
  éducation: "#2563EB",
  loisirs: "#9333EA",
  factures: "#EA580C",
  shopping: "#DB2777",
  autre: "#6B7570",
};
