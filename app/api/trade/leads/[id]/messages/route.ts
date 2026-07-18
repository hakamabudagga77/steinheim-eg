import { randomUUID } from "node:crypto";
import type { TradeLeadMessage, TradeLeadMessageSender } from "@/lib/trade-leads";
import { getTradeLead, saveTradeLead } from "@/lib/server/trade-lead-store";
import { sendTradeMessageNotification } from "@/lib/server/trade-lead-email";
import { isAdminRequest } from "@/lib/server/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const sendBuckets = new Map<string, { count: number; resetAt: number }>();

function clientKey(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
}

function canSend(request: Request) {
  const key = clientKey(request);
  const now = Date.now();
  const bucket = sendBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    sendBuckets.set(key, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true;
  }
  if (bucket.count >= 20) return false;
  bucket.count += 1;
  return true;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return Response.json({ error: "A lead id is required." }, { status: 400 });
  try {
    const lead = await getTradeLead(id);
    if (!lead) return Response.json({ error: "Not found." }, { status: 404 });
    return Response.json(
      { messages: lead.messages, status: lead.status, reference: lead.reference },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    const unavailable = error instanceof Error && error.message === "TRADE_STORE_NOT_CONFIGURED";
    return Response.json({ error: unavailable ? "Trade lead storage is not configured." : "Could not load messages." }, { status: 503 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return Response.json({ error: "A lead id is required." }, { status: 400 });
  if (Number(request.headers.get("content-length") || 0) > 20_000) {
    return Response.json({ error: "Request is too large." }, { status: 413 });
  }

  const body = await request.json().catch(() => null) as { from?: unknown; body?: unknown } | null;
  const from: TradeLeadMessageSender | null = body?.from === "customer" || body?.from === "steinheim" ? body.from : null;
  const text = typeof body?.body === "string" ? body.body.trim().slice(0, 4000) : "";

  if (!from || !text) {
    return Response.json({ error: "A sender and message body are required." }, { status: 400 });
  }
  if (from === "steinheim" && !isAdminRequest(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (from === "customer" && !canSend(request)) {
    return Response.json({ error: "Too many messages. Try again shortly." }, { status: 429 });
  }

  try {
    const lead = await getTradeLead(id);
    if (!lead) return Response.json({ error: "Not found." }, { status: 404 });

    const message: TradeLeadMessage = {
      id: randomUUID(),
      from,
      body: text,
      sentAt: new Date().toISOString(),
    };
    const updated = { ...lead, messages: [...lead.messages, message], updatedAt: message.sentAt };
    await saveTradeLead(updated);

    try {
      await sendTradeMessageNotification(updated, message);
    } catch (error) {
      console.error("Trade message notification email failed:", error);
    }

    return Response.json({ ok: true, message });
  } catch (error) {
    const unavailable = error instanceof Error && error.message === "TRADE_STORE_NOT_CONFIGURED";
    return Response.json({ error: unavailable ? "Trade lead storage is not configured." : "Could not send message." }, { status: 503 });
  }
}
