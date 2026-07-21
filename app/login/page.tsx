"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-sm p-8">
        <h1 className="font-display text-2xl font-bold text-emerald-900 mb-1">
          Mes Dépenses
        </h1>
        <p className="text-ink-500 text-sm mb-6">
          Suivi personnel — synchronisé avec Telegram
        </p>

        <div className="flex mb-6 rounded-lg bg-emerald-100 p-1 text-sm font-medium">
          <button
            className={`flex-1 py-2 rounded-md transition ${
              mode === "login" ? "bg-white shadow-sm text-emerald-800" : "text-ink-500"
            }`}
            onClick={() => setMode("login")}
            type="button"
          >
            Connexion
          </button>
          <button
            className={`flex-1 py-2 rounded-md transition ${
              mode === "signup" ? "bg-white shadow-sm text-emerald-800" : "text-ink-500"
            }`}
            onClick={() => setMode("signup")}
            type="button"
          >
            Créer un compte
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-ink-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-600"
              placeholder="vous@exemple.com"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-ink-700">
              Mot de passe
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-ink-100 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-600"
              placeholder="••••••••"
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
            {loading
              ? "Veuillez patienter..."
              : mode === "login"
              ? "Se connecter"
              : "Créer mon compte"}
          </button>
        </form>
      </div>
    </main>
  );
}
