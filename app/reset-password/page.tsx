"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  async function onReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setMsg("✅ Mot de passe mis à jour. Redirection…");
      setTimeout(() => router.push("/login"), 1500);
    } catch (err: any) {
      setMsg(err?.message ?? "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto mt-20 max-w-sm px-4 text-white">
      <h1 className="mb-4 text-2xl font-bold">Nouveau mot de passe</h1>

      <form onSubmit={onReset}>
        <input
          type="password"
          placeholder="Nouveau mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full rounded-xl border border-white/20 bg-black px-4 py-3"
        />

        <button
          disabled={loading}
          className="mt-4 w-full rounded-xl bg-white py-3 font-bold text-black"
        >
          {loading ? "..." : "Valider"}
        </button>
      </form>

      {msg && <p className="mt-3 text-sm text-white/70">{msg}</p>}
    </main>
  );
}