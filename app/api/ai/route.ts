import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY manquante" },
      { status: 500 }
    );
  }

  const body = await req.json();
  const messages = body?.messages;

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: "messages manquants" },
      { status: 400 }
    );
  }

  const systemPrompt =
    "Tu es DEBLOK, coach business direct et rassurant.";

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-5",
      stream: true,
      input: [
        { role: "developer", content: systemPrompt },
        ...messages,
      ],
    }),
  });

  return new Response(res.body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}