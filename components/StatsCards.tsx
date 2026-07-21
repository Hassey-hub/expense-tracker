import { Expense } from "@/lib/types";

export default function StatsCards({
  expenses,
  currency,
}: {
  expenses: Expense[];
  currency: string;
}) {
  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const count = expenses.length;
  const average = count > 0 ? total / count : 0;

  const byCategory: Record<string, number> = {};
  for (const e of expenses) {
    byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount);
  }
  const topCategory =
    Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

  const cards = [
    { label: "Total dépensé", value: `${total.toLocaleString("fr-FR")} ${currency}` },
    { label: "Nombre de dépenses", value: String(count) },
    { label: "Dépense moyenne", value: `${Math.round(average).toLocaleString("fr-FR")} ${currency}` },
    { label: "Catégorie principale", value: topCategory },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="card p-5">
          <p className="text-xs text-ink-500 uppercase tracking-wide font-medium">
            {c.label}
          </p>
          <p className="font-display text-xl font-bold text-emerald-900 mt-1">
            {c.value}
          </p>
        </div>
      ))}
    </div>
  );
}
