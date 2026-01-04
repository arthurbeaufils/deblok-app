"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Msg = {
  role: "user" | "assistant";
  content: string;
};

function safeJsonParse(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

/**
 * Consomme un buffer SSE (format OpenAI realtime/stream via "event:" + "data:")
 * Appelle onEvent(eventName, dataStr) pour chaque event complet.
 * Retourne le buffer restant (incomplet).
 */
function consumeSSEChunk(
  buffer: string,
  onEvent: (eventName: string, dataStr: string) => void
) {
  // Les events sont séparés par une ligne vide \n\n
  const parts = buffer.split("\n\n");
  const remainder = parts.pop() ?? "";

  for (const part of parts) {
    const lines = part.split("\n");
    let eventName = "";
    let dataStr = "";

    for (const line of lines) {
      if (line.startsWith("event:")) eventName = line.slice(6).trim();
      if (line.startsWith("data:")) dataStr = line.slice(5).trim();
    }

    if (eventName && dataStr) onEvent(eventName, dataStr);
  }

  return remainder;
}

export default function FolderChatPage() {
  const router = useRouter();
  const params = useParams<{ folderId: string }>();
  const folderId = params?.folderId ?? "";

  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        `Salut ! On attaque.\n\n` +
        `Donne-moi en 1 phrase : ton objectif, ta cible, ta deadline, et ta contrainte n°1.\n` +
        `Exemple: "Signer 10 clients B2B (PME) d'ici le 30/04 avec 500 € de budget pub."`,
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const snapshotForApi = useMemo(() => messages, [messages]);

  async function send() {
    if (!input.trim() || sending) return;

    const userMsg: Msg = { role: "user", content: input.trim() };
    const snapshot = [...snapshotForApi, userMsg]; // message list envoyée à l'API

    setSending(true);
    setInput("");

    // ✅ On ajoute UNE SEULE fois: user + placeholder assistant
    setMessages((m) => [
      ...m,
      userMsg,
      { role: "assistant", content: "DEBLOK écrit…" },
    ]);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folderId,
          messages: snapshot,
        }),
      });

      if (!res.ok || !res.body) throw new Error("Réponse vide (API)");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      let buffer = "";
      let aiText = "";

      const updateAssistant = (text: string) => {
        setMessages((m) => {
          const copy = [...m];
          // met à jour le dernier assistant (placeholder)
          for (let i = copy.length - 1; i >= 0; i--) {
            if (copy[i].role === "assistant") {
              copy[i] = { role: "assistant", content: text };
              break;
            }
          }
          return copy;
        });
      };

      const onEvent = (evtName: string, dataStr: string) => {
        // On ne garde que les deltas de texte utiles
        if (evtName === "response.output_text.delta") {
          const obj = safeJsonParse(dataStr);
          const delta = obj?.delta;
          if (typeof delta === "string" && delta.length) {
            aiText += delta;
            updateAssistant(aiText);
          }
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        buffer = consumeSSEChunk(buffer, onEvent);
      }

      // flush final si reste
      if (buffer.trim().length) {
        buffer = consumeSSEChunk(buffer + "\n\n", onEvent);
      }

      if (!aiText.trim()) updateAssistant("⚠️ Aucun texte reçu (stream vide).");
    } catch (e: any) {
      setMessages((m) => {
        const copy = [...m];
        for (let i = copy.length - 1; i >= 0; i--) {
          if (copy[i].role === "assistant") {
            copy[i] = {
              role: "assistant",
              content: "❌ Erreur : " + (e?.message || "Erreur IA"),
            };
            break;
          }
        }
        return copy;
      });
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  // ===============================
  // UI (design que tu as montré)
  // ===============================
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-3xl px-4 py-6">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => router.push("/app")}
            className="rounded-xl border border-white/15 px-3 py-2 text-sm hover:bg-white/5"
          >
            ← Retour
          </button>

          <div className="text-right">
            <div className="text-xs text-white/50">Dossier</div>
            <div className="text-lg font-semibold">{folderId}</div>
          </div>
        </div>

        {/* Chat */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.03]">
          <div className="h-[65vh] overflow-y-auto px-4 py-4">
            {messages.map((m, i) => (
              <div key={i} className="mb-3">
                <div className="text-[11px] tracking-widest text-white/40">
                  {m.role === "user" ? "TOI" : "DEBLOK"}
                </div>

                <div
                  className={`mt-1 whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm ${
                    m.role === "user"
                      ? "bg-white/5 border border-white/10"
                      : "bg-black/30 border border-white/10"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-white/10 p-4">
            <div className="flex gap-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Écris ici…"
                className="min-h-[44px] w-full resize-none rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none"
              />
              <button
                onClick={send}
                disabled={sending || !input.trim()}
                className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black disabled:opacity-50"
              >
                Envoyer
              </button>
            </div>

            <div className="mt-2 text-xs text-white/35">
              Entrée = envoyer • Shift+Entrée = aller à la ligne
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}