import { NextResponse } from "next/server";

export const runtime = "nodejs";

function extractText(json: any): string {
  if (typeof json?.output_text === "string" && json.output_text.trim()) {
    return json.output_text.trim();
  }
  const out = json?.output;
  if (Array.isArray(out)) {
    const chunks: string[] = [];
    for (const item of out) {
      const content = item?.content;
      if (Array.isArray(content)) {
        for (const c of content) {
          if (c?.type === "output_text" && typeof c?.text === "string") {
            chunks.push(c.text);
          }
        }
      }
    }
    const txt = chunks.join("").trim();
    if (txt) return txt;
  }
  return "";
}

function cleanTitle(t: string) {
  return t
    .replace(/^["'«»]+|["'«»]+$/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userText = String(body?.userText ?? "").trim();
    const aiText = String(body?.aiText ?? "").trim();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY manquante" }, { status: 500 });
    }
    if (!userText) {
      return NextResponse.json({ error: "userText manquant" }, { status: 400 });
    }

    const prompt =
      "Génère un titre de dossier très court (2 à 5 mots), en français, sans guillemets, sans point final. " +
      "Contexte:\n" +
      `Message utilisateur: ${userText}\n` +
      (aiText ? `Réponse assistant: ${aiText}\n` : "") +
      "Donne uniquement le titre.";

    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5",
        reasoning: { effort: "low" },
        input: [{ role: "developer", content: prompt }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: "OpenAI error", details: errText }, { status: 500 });
    }

    const json = await res.json();
    const title = cleanTitle(extractText(json)) || "Dossier";

    return NextResponse.json({ title });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Erreur serveur" }, { status: 500 });
  }
}
