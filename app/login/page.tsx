"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMsg("Compte créé. Tu peux te connecter.");
        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push("/app");
      }
    } catch (err: any) {
      setMsg(err?.message ?? "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 20, maxWidth: 420, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginTop: 30 }}>DEBLOK</h1>
      <p style={{ marginTop: 8, opacity: 0.8 }}>
        Connecte-toi pour accéder à tes dossiers.
      </p>

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button
          onClick={() => setMode("login")}
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 12,
            border: "1px solid #333",
            background: mode === "login" ? "#111" : "transparent",
            color: "white",
          }}
        >
          Connexion
        </button>
        <button
          onClick={() => setMode("signup")}
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 12,
            border: "1px solid #333",
            background: mode === "signup" ? "#111" : "transparent",
            color: "white",
          }}
        >
          Créer un compte
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
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
            fontWeight: 700,
            marginTop: 12,
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "..." : mode === "signup" ? "Créer" : "Se connecter"}
        </button>

        {msg && <p style={{ marginTop: 12, color: "#ddd" }}>{msg}</p>}
      </form>
    </main>
  );
}
