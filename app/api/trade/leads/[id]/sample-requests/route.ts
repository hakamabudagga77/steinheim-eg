import { randomUUID, timingSafeEqual } from "node:crypto";
import type { TradeLeadSampleRequest } from "@/lib/trade-leads";
import { getTradeLead, saveTradeLead } from "@/lib/server/trade-lead-store";
import { sendSampleRequestNotification } from "@/lib/server/trade-lead-email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestBuckets = new Map<string, { count: number; resetAt: number }>();

function clientKey(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
}

function canRequest(request: Request) {
  const key = clientKey(request);
  const now = Date.now();
  const bucket = requestBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    requestBuckets.set(key, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true;
  }
  if (bucket.count >= 10) return false;
  bucket.count += 1;
  return true;
}

function isAdmin(request: Request) {
  if (process.env.NODE_ENV !== "production") return true;
  const configured = process.env.TRADE_ADMIN_KEY;
  const supplied = request.headers.get("x-steinheim-admin-key") || "";
  if (!configured || !supplied || configured.length !== supplied.length) return false;
  return timingSafeEqual(Buffer.from(configured), Buffer.from(supplied));
}

// Customer creates a sample or showroom-visit request against their own lead —
// same "the lead id is the capability token" model as messages/accept-quote.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return Response.json({ error: "A lead id is required." }, { status: 400 });
  if (!canRequest(request)) {
    return Response.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
  }

  const body = await request.json().catch(() => null) as { note?: unknown; address?: unknown } | null;
  const note = typeof body?.note === "string" ? body.note.trim().slice(0, 1000) : "";
  const address = typeof body?.address === "string" ? body.address.trim().slice(0, 500) : "";
  if (!note) return Response.json({ error: "Please describe which samples you'd like." }, { status: 400 });
  if (!address) return Response.json({ error: "Please add a delivery address." }, { status: 400 });

  try {
    const lead = await getTradeLead(id);
    if (!lead) return Response.json({ error: "Not found." }, { status: 404 });

    const entry: TradeLeadSampleRequest = { id: randomUUID(), note, address, requestedAt: new Date().toISOString() };
    const updated = { ...lead, sampleRequests: [...lead.sampleRequests, entry], updatedAt: entry.requestedAt };
    await saveTradeLead(updated);

    try {
      await sendSampleRequestNotification(updated, entry);
    } catch (error) {
      console.error("Sample request notification email failed:", error);
    }

    return Response.json({ ok: true, request: entry });
  } catch (error) {
    const unavailable = error instanceof Error && error.message === "TRADE_STORE_NOT_CONFIGURED";
    return Response.json(
      { error: unavailable ? "Trade lead storage is not configured." : "Could not send the request." },
      { status: 503 }
    );
  }
}

// Admin marks a sample request fulfilled.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!id) return Response.json({ error: "A lead id is required." }, { status: 400 });

  const body = await request.json().catch(() => null) as { requestId?: unknown } | null;
  if (!body || typeof body.requestId !== "string") {
    return Response.json({ error: "A request id is required." }, { status: 400 });
  }

  try {
    const lead = await getTradeLead(id);
    if (!lead) return Response.json({ error: "Not found." }, { status: 404 });

    const now = new Date().toISOString();
    const sampleRequests = lead.sampleRequests.map((entry) =>
      entry.id === body.requestId ? { ...entry, fulfilledAt: now } : entry
    );
    const updated = { ...lead, sampleRequests, updatedAt: now };
    await saveTradeLead(updated);

    return Response.json({ ok: true, sampleRequests });
  } catch (error) {
    const unavailable = error instanceof Error && error.message === "TRADE_STORE_NOT_CONFIGURED";
    return Response.json(
      { error: unavailable ? "Trade lead storage is not configured." : "Could not update the request." },
      { status: 503 }
    );
  }
}
