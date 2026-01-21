"use client";

import { useEffect, useRef, useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type SSEPayload =
  | { type: "text"; text: string }
  | { type: "done" }
  | { type: string; [k: string]: any };

export default function ChatClient({ folderId }: { folderId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesRef = useRef<Message[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [sending, setSending] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Toujours garder une ref à jour (utile pour fetch payload)
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, thinking]);

  function appendAssistantText(text: string) {
    if (!text) return;

    setMessages((prev) => {
      const copy = [...prev];
      const last = copy[copy.length - 1];

      if (last?.role === "assistant") {
        copy[copy.length - 1] = { ...last, content: last.content + text };
      } else {
        copy.push({ role: "assistant", content: text });
      }
      return copy;
    });

    scrollToBottom();
  }

  function ensureAssistantBubble() {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.role === "assistant") return prev;
      return [...prev, { role: "assistant", content: "" }];
    });
  }

  function parseSSEChunkToDataLines(buffer: string) {
    // SSE events séparés par \n\n
    const parts = buffer.split("\n\n");
    const rest = parts.pop() ?? "";
    const events = parts;

    const dataLines: string[] = [];
    for (const evt of events) {
      const lines = evt.split("\n"); // surtout PAS de trim()
      for (const line of lines) {
        if (line.startsWith("data:")) {
          // supporte "data:" et "data: "
          const raw = line.startsWith("data: ")
            ? line.slice(6)
            : line.slice(5);
          dataLines.push(raw);
        }
      }
    }
    return { dataLines, rest };
  }

  async function sendMessage() {
    const text = input;
    if (!text.trim() || sending) return;

    const userMessage: Message = { role: "user", content: text };

    setInput("");
    setSending(true);
    setThinking(true);

    // Ajoute le message user + bulle assistant vide
    setMessages((prev) => [...prev, userMessage, { role: "assistant", content: "" }]);
    scrollToBottom();

    try {
      // IMPORTANT: payload avec messages à jour (ref)
      const payloadMessages = [...messagesRef.current, userMessage];

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folderId,
          messages: payloadMessages,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error("Bad response");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const { dataLines, rest } = parseSSEChunkToDataLines(buffer);
        buffer = rest;

        if (dataLines.length === 0) continue;

        for (const raw of dataLines) {
          if (!raw) continue;

          let payload: SSEPayload | null = null;

          // Ton serveur envoie du JSON dans data:
          try {
            payload = JSON.parse(raw);
          } catch {
            // si jamais un jour tu envoies du texte brut
            payload = { type: "text", text: raw };
          }

          if (!payload) continue;

          if (payload.type === "done") {
            setThinking(false);
            setSending(false);
            scrollToBottom();
            return;
          }

          if (payload.type === "text") {
            // Afficher seulement le vrai texte
            ensureAssistantBubble();
            appendAssistantText(payload.text ?? "");
          }
        }
      }
    } catch (e) {
      console.error(e);
      appendAssistantText("\nErreur serveur. Réessaie.");
    } finally {
      setThinking(false);
      setSending(false);
      scrollToBottom();
    }
  }

  return (
    <div className="flex h-full flex-col bg-black text-white">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        {messages.map((m, idx) => {
          const isAssistant = m.role === "assistant";
          const isLast = idx === messages.length - 1;

          const showThinking =
            isAssistant && isLast && thinking && (m.content ?? "").length === 0;

          return (
            <div key={idx} className="rounded-xl border border-white/10 p-3">
              <div className="text-xs text-white/50 mb-2">
                {isAssistant ? "DEBLOK" : "TOI"}
              </div>

              <div className="whitespace-pre-wrap">
                {showThinking ? "Deblok réfléchit…" : m.content}
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-white/10 p-4">
        <textarea
          className="w-full resize-none rounded-lg bg-black border border-white/20 p-3 text-white focus:outline-none"
          rows={2}
          placeholder="Écris ici…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />
        <div className="mt-2 text-xs text-white/40">
          Entrée = envoyer • Shift+Entrée = aller à la ligne
        </div>
      </div>
    </div>
  );
}