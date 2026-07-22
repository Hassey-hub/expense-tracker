"use client";

import { useState } from "react";
import { Expense } from "@/lib/types";
import { CATEGORIES } from "@/lib/nlp";
import { CATEGORIES } from "@/lib/categories";
export default function ExpenseForm({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (expense: Expense) => void;
}) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("autre");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: Number(amount),
        category,
        description,
        expense_date: date,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Erreur lors de l'ajout");
      return;
    }

    onCreated(data.expense);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-ink-900/40 flex items-center justify-center px-4 z-50">
      <div className="card w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-lg text-emerald-900">
            Ajouter une dépense
          </h2>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-900">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-ink-700">Montant (FCFA)</label>
            <input
              type="number"
              required
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-600"
              placeholder="5000"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-ink-700">Catégorie</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-600"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-ink-700">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-600"
              placeholder="Repas au restaurant"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-ink-700">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-medium rounded-lg py-2.5 transition disabled:opacity-50"
          >
            {loading ? "Ajout en cours..." : "Ajouter"}
          </button>
        </form>
      </div>
    </div>
  );
}
