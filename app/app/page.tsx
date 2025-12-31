"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Folder = { id: string; title: string | null; updated_at: string | null };

export default function AppHomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    setLoading(true);

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      router.replace("/login");
      return;
    }

    const { data, error } = await supabase
      .from("folders")
      .select("id, title, updated_at")
      .eq("is_archived", false)
      .order("updated_at", { ascending: false });

    if (error) setError(error.message);
    setFolders(data ?? []);
    setLoading(false);
  }

  async function createFolder() {
    setError(null);

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) {
      router.replace("/login");
      return;
    }

    const { data, error } = await supabase
      .from("folders")
      .insert([{ user_id: user.id, title: "Nouveau dossier" }])
      .select("id")
      .single();

    if (error) {
      setError(error.message);
      return;
    }

    // reload list + go to folder
    await load();
    router.push(`/app/${data.id}`);
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <main style={{ padding: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>DEBLOK</h1>
        <p style={{ marginTop: 8, opacity: 0.7 }}>Chargement…</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 16, maxWidth: 520, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>DEBLOK</h1>
          <p style={{ marginTop: 4, opacity: 0.7 }}>Tes dossiers</p>
        </div>

        <button
          onClick={signOut}
          style={{
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid #333",
            background: "transparent",
            color: "white",
            fontWeight: 700,
          }}
        >
          Déconnexion
        </button>
      </div>

      <button
        onClick={createFolder}
        style={{
          width: "100%",
          padding: 14,
          borderRadius: 14,
          border: "none",
          background: "white",
          color: "black",
          fontWeight: 800,
          marginTop: 14,
        }}
      >
        + Nouveau dossier
      </button>

      {error && (
        <div style={{ marginTop: 12, padding: 12, border: "1px solid #333", borderRadius: 14, opacity: 0.9 }}>
          Erreur: {error}
        </div>
      )}

      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        {folders.length === 0 ? (
          <div style={{ padding: 14, border: "1px solid #333", borderRadius: 14, opacity: 0.8 }}>
            Aucun dossier. Clique sur “+ Nouveau dossier”.
          </div>
        ) : (
          folders.map((f) => (
            <button
              key={f.id}
              onClick={() => router.push(`/app/${f.id}`)}
              style={{
                textAlign: "left",
                padding: 14,
                border: "1px solid #333",
                borderRadius: 14,
                background: "transparent",
                color: "white",
              }}
            >
              <div style={{ fontWeight: 800 }}>{f.title || "Dossier"}</div>
              <div style={{ marginTop: 4, opacity: 0.65, fontSize: 13 }}>Ouvrir →</div>
            </button>
          ))
        )}
      </div>
    </main>
  );
}
