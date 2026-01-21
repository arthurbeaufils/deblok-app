import OpenAI from "openai";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

function sseData(obj: unknown) {
  // IMPORTANT: un seul event = \n\n
  return `data: ${JSON.stringify(obj)}\n\n`;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { messages?: ChatMsg[] };
    const messages = body.messages ?? [];

    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages invalid" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const stream = await openai.responses.stream({
      model: "gpt-4.1-mini",
      input: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const encoder = new TextEncoder();

    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          // Ping debug (prouve que la route utilisée est bien celle-ci)
          controller.enqueue(encoder.encode(sseData({ type: "meta", v: "AI_ROUTE_V1" })));

          for await (const event of stream) {
            // Texte streaming
            if (event.type === "response.output_text.delta") {
              // IMPORTANT: on envoie le texte EXACT, espaces inclus
              controller.enqueue(
                encoder.encode(
                  sseData({
                    type: "text",
                    text: event.delta,
                  })
                )
              );
            }

            // Fin
            if (event.type === "response.completed") {
              controller.enqueue(encoder.encode(sseData({ type: "done" })));
              break;
            }
          }
        } catch (e) {
          controller.enqueue(encoder.encode(sseData({ type: "error", message: "Erreur serveur" })));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "bad request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}