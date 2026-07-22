import OpenAI from "openai";
import { CATEGORIES, Category } from "@/lib/categories";

export { CATEGORIES } from "@/lib/categories";
export type { Category } from "@/lib/categories";

export interface ParsedExpense {
  amount: number | null;
  category: Category | null;
  description: string;
  needs_clarification: boolean;
  clarification_question: string | null;
}

/**
 * Extrait montant / catégorie / description d'un message en français libre,
 * ex: "J'ai dépensé 5000 FCFA en nourriture", "Taxi 2000", "Ajoute 15000 pour loyer"
 */
export async function parseExpenseMessage(
  message: string
): Promise<ParsedExpense> {
  const systemPrompt = `Tu es un assistant qui extrait des informations de dépenses personnelles à partir de messages en français (devise par défaut : FCFA).

Catégories valides : ${CATEGORIES.join(", ")}.

Règles :
- Si tu identifies un montant clair et une catégorie évidente ou déductible, renvoie needs_clarification = false.
- Si le montant est absent ou ambigu, ou si la catégorie est vraiment impossible à déduire, renvoie needs_clarification = true et pose une question courte et précise en français dans clarification_question.
- La "description" doit être un résumé court et naturel (ex: "Taxi", "Repas au restaurant", "Loyer du mois").
- Déduis la catégorie même si elle n'est pas explicitement écrite (ex: "taxi", "essence", "moto" → transport ; "riz", "restaurant", "marché" → nourriture ; "école",
