import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/export -> télécharge toutes les dépenses de l'utilisateur en CSV
export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "non authentifié" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("expenses")
    .select("expense_date, category, amount, description, source")
    .eq("user_id", user.id)
    .order("expense_date", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const header = "Date,Catégorie,Montant,Description,Source\n";
  const rows = (data || [])
    .map((e) =>
      [
        e.expense_date,
        e.category,
        e.amount,
        `"${(e.description || "").replace(/"/g, '""')}"`,
        e.source,
      ].join(",")
    )
    .join("\n");

  const csv = header + rows;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="depenses_${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
    },
  });
}
