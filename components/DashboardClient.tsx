"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Expense } from "@/lib/types";
import StatsCards from "./StatsCards";
import ExpenseCharts from "./ExpenseCharts";
import ExpenseList from "./ExpenseList";
import ExpenseForm from "./ExpenseForm";
import TelegramLinkCard from "./TelegramLinkCard";

type Range = "day" | "week" | "month" | "all";

interface Profile {
  telegram_chat_id: string | null;
  telegram_link_code: string | null;
  currency: string | null;
  email: string | null;
}

export default function DashboardClient({
  userId,
  initialExpenses,
  profile,
}: {
  userId: string;
  initialExpenses: Expense[];
  profile: Profile | null;
}) {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [range, setRange] = useState<Range>("month");
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Abonnement en temps réel : toute nouvelle dépense (ajoutée via le bot
  // ou le site) apparaît immédiatement sans recharger la page.
  useEffect(() => {
    const channel = supabase
      .channel("expenses-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "expenses",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setExpenses((prev) => [payload.new as Expense, ...prev]);
          } else if (payload.eventType === "DELETE") {
            setExpenses((prev) =>
              prev.filter((e) => e.id !== (payload.old as Expense).id)
            );
          } else if (payload.eventType === "UPDATE") {
            setExpenses((prev) =>
              prev.map((e) =>
                e.id === (payload.new as Expense).id
                  ? (payload.new as Expense)
                  : e
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  const filtered = useMemo(() => {
    const now = new Date();
    return expenses.filter((e) => {
      const d = new Date(e.expense_date);
      if (range === "day") {
        return e.expense_date === now.toISOString().slice(0, 10);
      }
      if (range === "week") {
        const start = new Date(now);
        start.setDate(now.getDate() - 7);
        return d >= start;
      }
      if (range === "month") {
        return (
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth()
        );
      }
      return true;
    });
  }, [expenses, range]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function handleDelete(id: string) {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    await fetch(`/api/expenses/${id}`, { method: "DELETE" });
  }

  return (
    <main className="min-h-screen px-4 py-8 md:px-10 max-w-6xl mx-auto">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-emerald-900">
            Mes Dépenses
          </h1>
          <p className="text-ink-500 text-sm">{profile?.email}</p>
        </div>
        <div className="flex gap-2">
          <a
            href="/api/export"
            className="text-sm font-medium border border-ink-100 rounded-lg px-4 py-2 hover:bg-white transition"
          >
            Exporter CSV
          </a>
          <button
            onClick={handleLogout}
            className="text-sm font-medium border border-ink-100 rounded-lg px-4 py-2 hover:bg-white transition"
          >
            Déconnexion
          </button>
        </div>
      </header>

      <TelegramLinkCard
        telegramChatId={profile?.telegram_chat_id ?? null}
        linkCode={profile?.telegram_link_code ?? null}
      />

      <div className="flex items-center justify-between mt-8 mb-4">
        <div className="flex gap-1 bg-emerald-100 rounded-lg p-1 text-sm font-medium">
          {(["day", "week", "month", "all"] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-md transition ${
                range === r ? "bg-white shadow-sm text-emerald-800" : "text-ink-500"
              }`}
            >
              {{ day: "Jour", week: "Semaine", month: "Mois", all: "Tout" }[r]}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-emerald-800 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg px-4 py-2 transition"
        >
          + Ajouter une dépense
        </button>
      </div>

      <StatsCards expenses={filtered} currency={profile?.currency || "FCFA"} />

      <ExpenseCharts expenses={filtered} />

      <ExpenseList
        expenses={filtered}
        currency={profile?.currency || "FCFA"}
        onDelete={handleDelete}
      />

      {showForm && (
        <ExpenseForm
          onClose={() => setShowForm(false)}
          onCreated={(exp) => setExpenses((prev) => [exp, ...prev])}
        />
      )}
    </main>
  );
}
