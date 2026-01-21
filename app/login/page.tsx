"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      router.push("/app");
    } catch (err: any) {
      setMsg(err?.message ?? "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 20, maxWidth: 420, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginTop: 30 }}>DEBLOK</h1>

      <form onSubmit={onLogin} style={{ marginTop: 16 }}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          type="email"
          required
          style={{
            width: "100%",
            padding: 14,
            borderRadius: 12,
            border: "1px solid #333",
            background: "transparent",
            color: "white",
            marginTop: 10,
          }}
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mot de passe"
          type="password"
          required
          style={{
            width: "100%",
            padding: 14,
            borderRadius: 12,
            border: "1px solid #333",
            background: "transparent",
            color: "white",
            marginTop: 10,
          }}
        />

        <button
          disabled={loading}
          style={{
            width: "100%",
            padding: 14,
            borderRadius: 12,
            border: "none",
            background: "white",
            color: "black",
            fontWeight: 800,
            marginTop: 12,
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "..." : "Connexion"}
        </button>
      </form>

      {/* Lien mot de passe oublié */}
      <div style={{ marginTop: 10 }}>
        <Link href="/forgot-password" style={{ color: "#cfcfcf" }}>
          Mot de passe oublié ?
        </Link>
      </div>

      {/* IMPORTANT : redirection directe, même champs vides */}
      <button
        type="button"
        onClick={() => router.push("/signup")}
        disabled={loading}
        style={{
          width: "100%",
          padding: 14,
          borderRadius: 12,
          border: "1px solid #333",
          background: "transparent",
          color: "white",
          fontWeight: 700,
          marginTop: 12,
          opacity: loading ? 0.7 : 1,
        }}
      >
        Créer un compte
      </button>

      {msg && <p style={{ marginTop: 12, color: "#ddd" }}>{msg}</p>}
    </main>
  );
}