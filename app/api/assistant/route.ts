import {
  answerSteinheimQuestion,
  type AssistantMessage,
} from "@/lib/assistant/steinheim-assistant";
import { streamAssistant } from "@/lib/assistant/claude-assistant";

export const runtime = "nodejs";
export const maxDuration = 30;

function sse(payload: unknown) {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

function chunkText(text: string) {
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    const slice = remaining.slice(0, 72);
    const boundary = slice.lastIndexOf(" ");
    const end = boundary > 32 ? boundary + 1 : slice.length;
    chunks.push(remaining.slice(0, end));
    remaining = remaining.slice(end);
  }
  return chunks;
}

export async function POST(request: Request) {
  let body: { messages?: AssistantMessage[]; locale?: string; projectContext?: string } = {};

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];

  const ruleResult = answerSteinheimQuestion(messages, body.projectContext ?? "");

  const hasAiKey = !!(process.env.ANTHROPIC_API_KEY || process.env.GROQ_API_KEY);

  if (!hasAiKey) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(encoder.encode(sse({ type: "meta", brain: ruleResult.brain, action: ruleResult.action })));
        for (const text of chunkText(ruleResult.text)) {
          controller.enqueue(encoder.encode(sse({ type: "delta", text })));
          await new Promise((resolve) => setTimeout(resolve, 12));
        }
        controller.enqueue(encoder.encode(sse({ type: "done", action: ruleResult.action })));
        controller.close();
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Steinheim-Brain": ruleResult.brain,
      },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(
        encoder.encode(sse({ type: "meta", brain: "claude-haiku+catalogue", action: ruleResult.action }))
      );

      try {
        const claudeMessages = messages
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

        await streamAssistant(
          claudeMessages,
          (delta) => {
            controller.enqueue(encoder.encode(sse({ type: "delta", text: delta })));
          },
          request.signal
        );
      } catch (err) {
        console.error("[assistant] AI failed, falling back to rule engine:", (err as Error).message);
        for (const text of chunkText(ruleResult.text)) {
          controller.enqueue(encoder.encode(sse({ type: "delta", text })));
        }
      }

      controller.enqueue(encoder.encode(sse({ type: "done", action: ruleResult.action })));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Steinheim-Brain": "ai+catalogue",
    },
  });
}
