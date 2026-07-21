import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
- Déduis la catégorie même si elle n'est pas explicitement écrite (ex: "taxi", "essence", "moto" → transport ; "riz", "restaurant", "marché" → nourriture ; "école", "frais scolaires" → éducation).
- Réponds UNIQUEMENT en JSON valide, sans texte autour, sans balises markdown, avec exactement ce format :
{"amount": number|null, "category": string|null, "description": string, "needs_clarification": boolean, "clarification_question": string|null}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: message },
    ],
  });

  const raw = completion.choices[0]?.message?.content?.trim() ?? "{}";
  const cleaned = raw.replace(/```json|```/g, "").trim();

  try {
    const parsed = JSON.parse(cleaned);
    return {
      amount: typeof parsed.amount === "number" ? parsed.amount : null,
      category: CATEGORIES.includes(parsed.category) ? parsed.category : null,
      description: parsed.description || message,
      needs_clarification: Boolean(parsed.needs_clarification),
      clarification_question: parsed.clarification_question || null,
    };
  } catch {
    // Repli simple si l'IA ne renvoie pas un JSON exploitable
    return fallbackParse(message);
  }
}

/**
 * Repli sans IA (regex + mots-clés), utilisé si OpenAI échoue ou n'est pas configuré.
 */
export function fallbackParse(message: string): ParsedExpense {
  const amountMatch = message.match(/(\d[\d\s.,]*)/);
  const amount = amountMatch
    ? parseFloat(amountMatch[1].replace(/\s/g, "").replace(",", "."))
    : null;

  const keywordMap: Record<string, Category> = {
    taxi: "transport",
    moto: "transport",
    bus: "transport",
    essence: "transport",
    carburant: "transport",
    transport: "transport",
    nourriture: "nourriture",
    repas: "nourriture",
    restaurant: "nourriture",
    marché: "nourriture",
    riz: "nourriture",
    loyer: "loyer",
    maison: "loyer",
    santé: "santé",
    médecin: "santé",
    pharmacie: "santé",
    école: "éducation",
    scolaire: "éducation",
    facture: "factures",
    électricité: "factures",
    eau: "factures",
    internet: "factures",
  };

  const lower = message.toLowerCase();
  let category: Category | null = null;
  for (const [keyword, cat] of Object.entries(keywordMap)) {
    if (lower.includes(keyword)) {
      category = cat;
      break;
    }
  }

  return {
    amount,
    category,
    description: message,
    needs_clarification: amount === null || category === null,
    clarification_question:
      amount === null
        ? "Quel est le montant de la dépense ?"
        : "Dans quelle catégorie classer cette dépense ? (nourriture, transport, loyer, santé, éducation, loisirs, factures, shopping, autre)",
  };
}
