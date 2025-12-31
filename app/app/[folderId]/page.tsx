"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Msg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export default function FolderPage() {
  const router = useRouter();
  const params = useParams();
  const folderId = params?.folderId as string | undefined;

  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState<string>("Dossier");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const canSend = useMemo(
    () => input.trim().length > 0 && !sending,
    [input, sending]
  );

  async function requireSession() {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      router.replace("/login");
      return null;
    }
    return data.session;
  }

  async function loadAll() {
    setError(null);

    if (!folderId) {
      setLoading(false);
      setError("FolderId manquant dans l’URL.");
      return;
    }

    setLoading(true);

    const session = await requireSession();
    if (!session) return;

    const folderRes = await supabase
      .from("folders")
      .select("id, title")
      .eq("id", folderId)
      .single();

    if (folderRes.error) {
      setError(folderRes.error.message);
      setLoading(false);
      return;
    }

    setTitle(folderRes.data?.title || "Dossier");

    const msgRes = await supabase
      .from("messages")
      .select("id, role, content, created_at")
      .eq("folder_id", folderId)
      .order("created_at", { ascending: true });

    if (msgRes.error) {
      setError(msgRes.error.message);
      setLoading(false);
      return;
    }

    setMessages((msgRes.data as Msg[]) ?? []);
    setLoading(false);
  }

  async function sendMessage() {
    setError(null);
    if (!folderId || !canSend) return;

    const session = await requireSession();
    if (!session) return;

    // ✅ On capture l’état AVANT envoi (pour détecter 1er message)
    const isFirstMessage = messages.length === 0;
    const shouldAutoRename =
      isFirstMessage && (title.trim() === "" || title === "Nouveau dossier");

    setSending(true);

    const userText = input.trim();
    setInput("");

    // 1) insert user message
    const insUser = await supabase.from("messages").insert([
      {
        folder_id: folderId,
        user_id: session.user.id,
        role: "user",
        content: userText,
      },
    ]);

    if (insUser.error) {
      setError(insUser.error.message);
      setSending(false);
      return;
    }

    // 2) call our server AI endpoint with last N messages
    const context = [...messages, { id: "local", role: "user" as const, content: userText, created_at: new Date().toISOString() }]
      .slice(-12)
      .map((m) => ({ role: m.role, content: m.content }));

    const aiRes = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: context }),
    });

    if (!aiRes.ok) {
      const t = await aiRes.text();
      setError("Erreur IA: " + t);
      setSending(false);
      return;
    }

    const { text } = await aiRes.json();
    const aiText = typeof text === "string" ? text : "Réponse vide.";

    // 3) insert assistant message (real)
    const insBot = await supabase.from("messages").insert([
      {
        folder_id: folderId,
        user_id: session.user.id,
        role: "assistant",
        content: aiText,
      },
    ]);

    if (insBot.error) {
      setError(insBot.error.message);
      setSending(false);
      return;
    }

    // 4) Auto-rename (uniquement si 1er message + titre default)
    if (shouldAutoRename) {
      try {
        const titleRes = await fetch("/api/title", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userText, aiText }),
        });

        if (titleRes.ok) {
          const data = await titleRes.json();
          const newTitle = String(data?.title ?? "").trim();

          if (newTitle) {
            const up = await supabase
              .from("folders")
              .update({ title: newTitle })
              .eq("id", folderId);

            if (!up.error) setTitle(newTitle);
          }
        }
      } catch {
        // si ça rate, on s'en fout : ça ne casse rien
      }
    }

    // 5) reload
    await loadAll();
    setSending(false);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderId]);

  if (loading) {
    return (
      <main style={{ padding: 16 }}>
        <p>Chargement…</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
      <button
        onClick={() => router.push("/app")}
        style={{
          border: "1px solid #333",
          background: "transparent",
          color: "white",
          borderRadius: 12,
          padding: "10px 12px",
        }}
      >
        ← Retour
      </button>

      <h1 style={{ fontSize: 22, fontWeight: 800, marginTop: 12 }}>
        {title}
      </h1>

      {error && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            border: "1px solid #333",
            borderRadius: 14,
          }}
        >
          Erreur: {error}
        </div>
      )}

      <div
        style={{
          marginTop: 14,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {messages.length === 0 ? (
          <div
            style={{
              padding: 16,
              border: "1px solid #333",
              borderRadius: 14,
              opacity: 0.95,
              lineHeight: 1.5,
            }}
          >
            <div style={{ fontWeight: 800, marginBottom: 6 }}>DEBLOK</div>
            <div>
              Comment je peux t’aider sur ce sujet ?
              <br />
              Tu peux me parler d’un problème, d’une idée, d’un mail à écrire ou
              d’une stratégie.
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "85%",
                padding: 12,
                borderRadius: 14,
                border: "1px solid #333",
                background: "transparent",
                color: "white",
                whiteSpace: "pre-wrap",
              }}
            >
              {m.role === "assistant" && (
                <div
                  style={{
                    fontWeight: 800,
                    opacity: 0.7,
                    fontSize: 12,
                    marginBottom: 6,
                  }}
                >
                  DEBLOK
                </div>
              )}
              {m.content}
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Écris ici…"
          style={{
            flex: 1,
            padding: 14,
            borderRadius: 14,
            border: "1px solid #333",
            background: "transparent",
            color: "white",
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
        />
        <button
          onClick={sendMessage}
          disabled={!canSend}
          style={{
            padding: "14px 16px",
            borderRadius: 14,
            border: "none",
            background: "white",
            color: "black",
            fontWeight: 800,
            opacity: canSend ? 1 : 0.5,
          }}
        >
          {sending ? "…" : "Envoyer"}
        </button>
      </div>
    </main>
  );
}
