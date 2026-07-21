import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * Endpoint appelé UNIQUEMENT par le bot Telegram (jamais par le navigateur).
 * Protégé par un secret partagé (BOT_API_SECRET), envoyé dans le header
 * "x-bot-secret". Le bot fournit un telegram_chat_id déjà lié à un profil.
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-bot-secret");
  if (!secret || secret !== process.env.BOT_API_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { telegram_chat_id, amount, category, description, expense_date } =
    body;

  // Validation stricte des données reçues
  if (!telegram_chat_id) {
    return NextResponse.json(
      { error: "telegram_chat_id requis" },
      { status: 400 }
    );
  }
  const numericAmount = Number(amount);
  if (!numericAmount || numericAmount <= 0) {
    return NextResponse.json(
      { error: "montant invalide" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  // Retrouver le profil lié à ce chat Telegram
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("telegram_chat_id", String(telegram_chat_id))
    .single();

  if (profileError || !profile) {
    return NextResponse.json(
      { error: "compte non lié. Utilisez /link <code> d'abord." },
      { status: 404 }
    );
  }

  const { data, error } = await supabase
    .from("expenses")
    .insert({
      user_id: profile.id,
      amount: numericAmount,
      category: category || "autre",
      description: description || null,
      source: "telegram",
      expense_date: expense_date || new Date().toISOString().slice(0, 10),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ expense: data }, { status: 201 });
}
