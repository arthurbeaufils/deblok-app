"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (password.length < 8) {
      setMsg("Mot de passe trop court (minimum 8 caractères).");
      return;
    }

    if (password !== confirm) {
      setMsg("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      setMsg("✅ Mot de passe mis à jour. Redirection…");
      setTimeout(() => {
        router.push("/login");
      }, 1200);
    } catch (err: any) {
      setMsg(err?.message ?? "Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 20, maxWidth: 420, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginTop: 30 }}>
        DEBLOK
      </h1>

      <p style={{ color: "#bbb", marginTop: 8 }}>
        Réinitialise ton mot de passe
      </p>

      <form onSubmit={onSubmit} style={{ marginTop: 16 }}>
        <input
          type="password"
          placeholder="Nouveau mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
          type="password"
          placeholder="Confirmer le mot de passe"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
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
          {loading ? "..." : "Réinitialiser"}
        </button>
      </form>

      {msg && (
        <p style={{ marginTop: 12, color: "#ddd" }}>
          {msg}
        </p>
      )}
    </main>
  );
}