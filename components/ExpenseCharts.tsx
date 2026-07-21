"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { Expense, CATEGORY_COLORS } from "@/lib/types";

export default function ExpenseCharts({ expenses }: { expenses: Expense[] }) {
  const byCategory: Record<string, number> = {};
  for (const e of expenses) {
    byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount);
  }
  const pieData = Object.entries(byCategory).map(([name, value]) => ({
    name,
    value,
  }));

  const byDate: Record<string, number> = {};
  for (const e of expenses) {
    byDate[e.expense_date] = (byDate[e.expense_date] || 0) + Number(e.amount);
  }
  const lineData = Object.entries(byDate)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, total]) => ({ date: date.slice(5), total }));

  if (expenses.length === 0) {
    return (
      <div className="card p-10 mt-6 text-center text-ink-500">
        Aucune dépense sur cette période. Envoyez un message à votre bot
        Telegram pour en ajouter une, ou cliquez sur « Ajouter une dépense ».
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-4 mt-6">
      <div className="card p-5">
        <p className="font-display font-semibold text-emerald-900 mb-2">
          Répartition par catégorie
        </p>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={90}
              label={(entry) => entry.name}
            >
              {pieData.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={CATEGORY_COLORS[entry.name] || "#6B7570"}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="card p-5">
        <p className="font-display font-semibold text-emerald-900 mb-2">
          Évolution des dépenses
        </p>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={lineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E7EBE8" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#0F6B4C"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
