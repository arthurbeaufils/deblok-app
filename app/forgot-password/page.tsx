"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onReset(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!email.trim()) {
      setMsg("👉 Entre ton email.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;

      setMsg("📩 Email envoyé. Vérifie ta boîte mail.");
    } catch (err: any) {
      setMsg(err?.message ?? "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto mt-20 max-w-sm px-4 text-white">
      <h1 className="mb-2 text-center text-3xl font-extrabold">DEBLOK</h1>
      <p className="mb-6 text-center text-sm text-white/60">
        Réinitialisation du mot de passe
      </p>

      <form onSubmit={onReset}>
        <input
          type="email"
          placeholder="Ton email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded-xl border border-white/20 bg-black px-4 py-3"
        />

        <button
          disabled={loading}
          className="w-full rounded-xl bg-white py-3 font-bold text-black disabled:opacity-60"
        >
          {loading ? "..." : "Réinitialiser"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => router.push("/login")}
        className="mt-4 w-full text-sm text-white/60 underline hover:text-white"
      >
        ← Retour à la connexion
      </button>

      {msg && <p className="mt-4 text-center text-sm text-white/70">{msg}</p>}
    </main>
  );
}