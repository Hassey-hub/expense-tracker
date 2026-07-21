import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/expenses?range=week|month|day|all
export async function GET(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "non authentifié" }, { status: 401 });
  }

  const range = req.nextUrl.searchParams.get("range") || "all";
  let query = supabase
    .from("expenses")
    .select("*")
    .eq("user_id", user.id)
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false });

  const now = new Date();
  if (range === "day") {
    query = query.eq("expense_date", now.toISOString().slice(0, 10));
  } else if (range === "week") {
    const start = new Date(now);
    start.setDate(now.getDate() - 7);
    query = query.gte("expense_date", start.toISOString().slice(0, 10));
  } else if (range === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    query = query.gte("expense_date", start.toISOString().slice(0, 10));
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ expenses: data });
}

// POST /api/expenses  (ajout manuel depuis le site)
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "non authentifié" }, { status: 401 });
  }

  const body = await req.json();
  const amount = Number(body.amount);
  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "montant invalide" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("expenses")
    .insert({
      user_id: user.id,
      amount,
      category: body.category || "autre",
      description: body.description || null,
      source: "web",
      expense_date: body.expense_date || new Date().toISOString().slice(0, 10),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ expense: data }, { status: 201 });
}
