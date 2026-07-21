"use client";

import { Expense, CATEGORY_COLORS } from "@/lib/types";

export default function ExpenseList({
  expenses,
  currency,
  onDelete,
}: {
  expenses: Expense[];
  currency: string;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="card mt-6 overflow-hidden">
      <p className="font-display font-semibold text-emerald-900 p-5 pb-0">
        Historique
      </p>
      <div className="divide-y divide-ink-100 mt-3">
        {expenses.map((e) => (
          <div
            key={e.id}
            className="flex items-center justify-between px-5 py-3 hover:bg-emerald-50/50 transition"
          >
            <div className="flex items-center gap-3">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: CATEGORY_COLORS[e.category] || "#6B7570" }}
              />
              <div>
                <p className="text-sm font-medium text-ink-900">
                  {e.description || e.category}
                </p>
                <p className="text-xs text-ink-500">
                  {e.category} · {e.expense_date}
                  {e.source === "telegram" ? " · via Telegram" : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold text-ink-900">
                {Number(e.amount).toLocaleString("fr-FR")} {currency}
              </span>
              <button
                onClick={() => onDelete(e.id)}
                className="text-ink-300 hover:text-red-500 transition text-sm"
                aria-label="Supprimer"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
        {expenses.length === 0 && (
          <p className="text-center text-ink-500 py-8">
            Aucune dépense pour le moment.
          </p>
        )}
      </div>
    </div>
  );
}
