import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * Endpoint appelé par le bot Telegram quand un utilisateur envoie /link <code>.
 * Lie le telegram_chat_id au profil correspondant au code de liaison
 * (généré automatiquement à la création du compte, visible sur le dashboard).
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-bot-secret");
  if (!secret || secret !== process.env.BOT_API_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { code, telegram_chat_id } = await req.json();
  if (!code || !telegram_chat_id) {
    return NextResponse.json(
      { error: "code et telegram_chat_id requis" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  const { data: profile, error: findError } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("telegram_link_code", String(code).toUpperCase())
    .single();

  if (findError || !profile) {
    return NextResponse.json(
      { error: "code invalide. Vérifiez le code sur votre dashboard." },
      { status: 404 }
    );
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ telegram_chat_id: String(telegram_chat_id) })
    .eq("id", profile.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, email: profile.email });
}
