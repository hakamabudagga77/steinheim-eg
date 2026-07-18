import type { TradeLeadDeliveryDetails } from "@/lib/trade-leads";
import { getTradeLead, saveTradeLead } from "@/lib/server/trade-lead-store";
import { sendDeliveryDetailsNotification } from "@/lib/server/trade-lead-email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const updateBuckets = new Map<string, { count: number; resetAt: number }>();

function clientKey(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
}

function canUpdate(request: Request) {
  const key = clientKey(request);
  const now = Date.now();
  const bucket = updateBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    updateBuckets.set(key, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true;
  }
  if (bucket.count >= 10) return false;
  bucket.count += 1;
  return true;
}

// Customer saves who/where to deliver to, against their own lead — same
// "the lead id is the capability token" model as messages/sample-requests.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return Response.json({ error: "A lead id is required." }, { status: 400 });
  if (!canUpdate(request)) {
    return Response.json({ error: "Too many updates. Try again shortly." }, { status: 429 });
  }

  const body = await request.json().catch(() => null) as { contactName?: unknown; contactPhone?: unknown; accessNotes?: unknown } | null;
  const contactName = typeof body?.contactName === "string" ? body.contactName.trim().slice(0, 120) : "";
  const contactPhone = typeof body?.contactPhone === "string" ? body.contactPhone.trim().slice(0, 60) : "";
  const accessNotes = typeof body?.accessNotes === "string" ? body.accessNotes.trim().slice(0, 1000) : "";
  if (!contactName || !contactPhone) {
    return Response.json({ error: "A site contact name and phone number are required." }, { status: 400 });
  }

  try {
    const lead = await getTradeLead(id);
    if (!lead) return Response.json({ error: "Not found." }, { status: 404 });

    const details: TradeLeadDeliveryDetails = { contactName, contactPhone, accessNotes, updatedAt: new Date().toISOString() };
    const updated = { ...lead, deliveryDetails: details, updatedAt: details.updatedAt };
    await saveTradeLead(updated);

    try {
      await sendDeliveryDetailsNotification(updated, details);
    } catch (error) {
      console.error("Delivery details notification email failed:", error);
    }

    return Response.json({ ok: true, deliveryDetails: details });
  } catch (error) {
    const unavailable = error instanceof Error && error.message === "TRADE_STORE_NOT_CONFIGURED";
    return Response.json(
      { error: unavailable ? "Trade lead storage is not configured." : "Could not save delivery details." },
      { status: 503 }
    );
  }
}
