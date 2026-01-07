"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push("/app");
    } catch (err: any) {
      setMsg(err?.message ?? "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }

  async function onSignup() {
    setMsg(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      setMsg("✅ Compte créé. Tu peux maintenant te connecter.");
    } catch (err: any) {
      setMsg(err?.message ?? "Erreur lors de la création du compte");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto mt-20 max-w-sm px-4 text-white">
      <h1 className="mb-6 text-center text-3xl font-extrabold">DEBLOK</h1>

      <form onSubmit={onLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mb-3 w-full rounded-xl border border-white/20 bg-black px-4 py-3"
        />

        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mb-4 w-full rounded-xl border border-white/20 bg-black px-4 py-3"
        />

        <button
          disabled={loading}
          className="w-full rounded-xl bg-white py-3 font-bold text-black disabled:opacity-60"
        >
          {loading ? "..." : "Connexion"}
        </button>
      </form>

      <button
        onClick={onSignup}
        disabled={loading}
        className="mt-3 w-full rounded-xl border border-white/20 py-3 font-semibold disabled:opacity-60"
      >
        Créer un compte
      </button>

      {/* ✅ Redirection vers page dédiée */}
      <button
        type="button"
        onClick={() => router.push("/forgot-password")}
        className="mt-4 w-full text-sm text-white/60 underline hover:text-white"
      >
        Mot de passe oublié ?
      </button>

      {msg && <p className="mt-4 text-center text-sm text-white/70">{msg}</p>}
    </main>
  );
}