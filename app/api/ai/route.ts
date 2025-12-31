import { NextResponse } from "next/server";

export const runtime = "nodejs";

type InMsg = { role: "user" | "assistant"; content: string };

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
  return "Désolé, je n’ai pas réussi à générer une réponse.";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages = (body?.messages ?? []) as InMsg[];

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY manquante" }, { status: 500 });
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "messages manquant" }, { status: 400 });
    }

    const safe = messages
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-20)
      .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));

    const systemPrompt =
      "Tu es DEBLOK, coach business direct et rassurant. Pose 1 à 3 questions si nécessaire, sinon donne un plan d’action concret en étapes.";

    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5",
        reasoning: { effort: "low" },
        input: [{ role: "developer", content: systemPrompt }, ...safe],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: "OpenAI error", details: errText }, { status: 500 });
    }

    const json = await res.json();
    const text = extractText(json);

    return NextResponse.json({ text });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Erreur serveur" }, { status: 500 });
  }
}
