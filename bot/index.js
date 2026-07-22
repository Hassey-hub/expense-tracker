require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const fetch = require("node-fetch");

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const API_BASE_URL = process.env.API_BASE_URL; // ex: https://mon-app.vercel.app
const BOT_API_SECRET = process.env.BOT_API_SECRET;

if (!TELEGRAM_TOKEN || !API_BASE_URL || !BOT_API_SECRET) {
  console.error(
    "Variables manquantes. Vérifiez TELEGRAM_BOT_TOKEN, API_BASE_URL, BOT_API_SECRET dans .env"
  );
  process.exit(1);
}

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

const pendingClarifications = new Map();

const CATEGORIES = [
  "nourriture",
  "transport",
  "loyer",
  "santé",
  "éducation",
  "loisirs",
  "factures",
  "shopping",
  "autre",
];

const KEYWORD_MAP = {
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

function fallbackParse(message) {
  const amountMatch = message.match(/(\d[\d\s.,]*)/);
  const amount = amountMatch
    ? parseFloat(amountMatch[1].replace(/\s/g, "").replace(",", "."))
    : null;

  const lower = message.toLowerCase();
  let category = null;
  for (const [keyword, cat] of Object.entries(KEYWORD_MAP)) {
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
        : `Dans quelle catégorie classer cette dépense ? (${CATEGORIES.join(", ")})`,
  };
}

async function parseExpenseMessage(message) {
  if (!OPENAI_API_KEY) return fallbackParse(message);

  const systemPrompt = `Tu es un assistant qui extrait des informations de dépenses personnelles à partir de messages en français (devise par défaut : FCFA).
Catégories valides : ${CATEGORIES.join(", ")}.
Règles :
- Si tu identifies un montant clair et une catégorie évidente ou déductible, renvoie needs_clarification = false.
- Si le montant est absent ou ambigu, ou si la catégorie est vraiment impossible à déduire, renvoie needs_clarification = true et pose une question courte en français dans clarification_question.
- La "description" doit être un résumé court et naturel.
- Déduis la catégorie même si elle n'est pas explicite (taxi/essence/moto -> transport ; riz/restaurant/marché -> nourriture ; école -> éducation).
- Le champ "amount" doit être un NOMBRE JSON (ex: 2000), jamais une chaîne de texte (donc pas "2000").
- Réponds UNIQUEMENT en JSON valide, sans texte autour, format exact :
{"amount": number|null, "category": string|null, "description": string, "needs_clarification": boolean, "clarification_question": string|null}`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
      }),
    });
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content?.trim() ?? "{}";
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    const finalAmount =
      parsed.amount !== null &&
      parsed.amount !== undefined &&
      !isNaN(Number(parsed.amount))
        ? Number(parsed.amount)
        : null;
    const finalCategory = CATEGORIES.includes(parsed.category)
      ? parsed.category
      : null;

    return {
      amount: finalAmount,
      category: finalCategory,
      description: parsed.description || message,
      needs_clarification: finalAmount === null || finalCategory === null,
      clarification_question: parsed.clarification_question || null,
    };
  } catch (err) {
    console.error("Erreur OpenAI, repli sur l'analyse par mots-clés:", err.message);
    return fallbackParse(message);
  }
}

async function saveExpense(chatId, { amount, category, description }) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/bot/add-expense`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-bot-secret": BOT_API_SECRET,
      },
      body: JSON.stringify({
        telegram_chat_id: String(chatId),
        amount,
        category,
        description,
      }),
    });
    return await res.json();
  } catch (err) {
    console.error("Erreur réseau lors de l'enregistrement de la dépense:", err.message);
    return { error: "Impossible de contacter le serveur. Réessayez dans un instant." };
  }
}

async function linkAccount(chatId, code) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/bot/link`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-bot-secret": BOT_API_SECRET,
      },
      body: JSON.stringify({ code, telegram_chat_id: String(chatId) }),
    });
    return await res.json();
  } catch (err) {
    console.error("Erreur réseau lors de la liaison du compte:", err.message);
    return { error: "Impossible de contacter le serveur. Réessayez dans un instant." };
  }
}

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "👋 Bienvenue ! Je suis votre assistant de suivi de dépenses.\n\n" +
      "1️⃣ D'abord, liez votre compte : sur votre dashboard web, copiez le code affiché et envoyez-moi :\n" +
      "/link VOTRE_CODE\n\n" +
      "2️⃣ Ensuite, envoyez-moi simplement vos dépenses, par exemple :\n" +
      "« J'ai dépensé 5000 FCFA en nourriture »\n" +
      "« Taxi 2000 »\n" +
      "« Ajoute 15000 pour loyer »"
  );
});

bot.onText(/\/link (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const code = match[1].trim();

  const result = await linkAccount(chatId, code);
  if (result.error) {
    bot.sendMessage(chatId, `❌ ${result.error}`);
  } else {
    bot.sendMessage(
      chatId,
      `✅ Compte lié avec succès (${result.email}) !\nVous pouvez maintenant m'envoyer vos dépenses.`
    );
  }
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text || text.startsWith("/")) return;

  try {
    const pending = pendingClarifications.get(chatId);
    if (pending) {
      pendingClarifications.delete(chatId);

      if (pending.missing === "amount") {
        const amountMatch = text.match(/(\d[\d\s.,]*)/);
        const amount = amountMatch
          ? parseFloat(amountMatch[1].replace(/\s/g, "").replace(",", "."))
          : null;
        if (!amount) {
          bot.sendMessage(chatId, "Je n'ai pas compris le montant. Réessayez, par exemple : 5000");
          return;
        }
        pending.data.amount = amount;
      } else if (pending.missing === "category") {
        const lower = text.toLowerCase().trim();
        const match = CATEGORIES.find((c) => lower.includes(c));
        pending.data.category = match || "autre";
      }

      await finalizeExpense(chatId, pending.data);
      return;
    }

    bot.sendChatAction(chatId, "typing");
    const parsed = await parseExpenseMessage(text);

    if (parsed.needs_clarification) {
      const missing = parsed.amount === null ? "amount" : "category";
      pendingClarifications.set(chatId, {
        missing,
        data: {
          amount: parsed.amount,
          category: parsed.category,
          description: parsed.description,
        },
      });
      bot.sendMessage(chatId, `🤔 ${parsed.clarification_question}`);
      return;
    }

    await finalizeExpense(chatId, {
      amount: parsed.amount,
      category: parsed.category,
      description: parsed.description,
    });
  } catch (err) {
    console.error("Erreur inattendue dans le traitement du message:", err);
    bot.sendMessage(
      chatId,
      "❌ Une erreur inattendue est survenue. Réessayez, ou reformulez votre message."
    );
  }
});

async function finalizeExpense(chatId, data) {
  const result = await saveExpense(chatId, data);

  if (result.error) {
    bot.sendMessage(
      chatId,
      result.error.includes("non lié")
        ? "⚠️ Votre compte n'est pas encore lié. Envoyez /link VOTRE_CODE (visible sur votre dashboard)."
        : `❌ Erreur : ${result.error}`
    );
    return;
  }

  const expense = result.expense;
  bot.sendMessage(
    chatId,
    `✅ Dépense enregistrée : ${Number(expense.amount).toLocaleString("fr-FR")} FCFA — ${expense.category}${
      expense.description ? " (" + expense.description + ")" : ""
    }`
  );
}

console.log("🤖 Bot Telegram démarré et à l'écoute des messages...");
