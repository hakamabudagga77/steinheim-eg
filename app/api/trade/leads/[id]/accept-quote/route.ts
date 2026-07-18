import { getTradeLead, saveTradeLead } from "@/lib/server/trade-lead-store";
import { sendQuoteAcceptedNotification } from "@/lib/server/trade-lead-email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const acceptBuckets = new Map<string, { count: number; resetAt: number }>();

function clientKey(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
}

function canAccept(request: Request) {
  const key = clientKey(request);
  const now = Date.now();
  const bucket = acceptBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    acceptBuckets.set(key, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true;
  }
  if (bucket.count >= 10) return false;
  bucket.count += 1;
  return true;
}

// Same "the lead id is the capability token" model as the messages and
// update-project endpoints — no admin key required, since only someone with
// the customer's own link can reach this route.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return Response.json({ error: "A lead id is required." }, { status: 400 });
  if (!canAccept(request)) {
    return Response.json({ error: "Too many attempts. Try again shortly." }, { status: 429 });
  }

  try {
    const lead = await getTradeLead(id);
    if (!lead) return Response.json({ error: "Not found." }, { status: 404 });
    if (!lead.quoteUrl) return Response.json({ error: "No quote is available to accept yet." }, { status: 400 });
    if (lead.quoteAcceptedAt) return Response.json({ ok: true, quoteAcceptedAt: lead.quoteAcceptedAt });

    const now = new Date().toISOString();
    const updated = {
      ...lead,
      quoteAcceptedAt: now,
      status: lead.status === "quoted" ? ("won" as const) : lead.status,
      updatedAt: now,
    };
    await saveTradeLead(updated);

    try {
      await sendQuoteAcceptedNotification(updated);
    } catch (error) {
      console.error("Quote accepted notification email failed:", error);
    }

    return Response.json({ ok: true, quoteAcceptedAt: now, status: updated.status });
  } catch (error) {
    const unavailable = error instanceof Error && error.message === "TRADE_STORE_NOT_CONFIGURED";
    return Response.json(
      { error: unavailable ? "Trade lead storage is not configured." : "Could not accept the quote." },
      { status: 503 }
    );
  }
}
