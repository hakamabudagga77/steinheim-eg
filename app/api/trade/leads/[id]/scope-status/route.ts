import { timingSafeEqual } from "node:crypto";
import { isTradeLeadStatus } from "@/lib/trade-leads";
import { getTradeLead, saveTradeLead } from "@/lib/server/trade-lead-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAdmin(request: Request) {
  if (process.env.NODE_ENV !== "production") return true;
  const configured = process.env.TRADE_ADMIN_KEY;
  const supplied = request.headers.get("x-steinheim-admin-key") || "";
  if (!configured || !supplied || configured.length !== supplied.length) return false;
  return timingSafeEqual(Buffer.from(configured), Buffer.from(supplied));
}

// Admin sets a status for one room/scope group within a lead, independent of
// the lead's overall status — lets a large multi-room order show "Master
// bathrooms: shipped, Powder rooms: sourcing stock" instead of one status
// for everything.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!id) return Response.json({ error: "A lead id is required." }, { status: 400 });

  const body = await request.json().catch(() => null) as { scopeId?: unknown; status?: unknown } | null;
  if (!body || typeof body.scopeId !== "string" || !isTradeLeadStatus(body.status)) {
    return Response.json({ error: "A scope id and valid status are required." }, { status: 400 });
  }

  try {
    const lead = await getTradeLead(id);
    if (!lead) return Response.json({ error: "Not found." }, { status: 404 });

    const scopeId = body.scopeId;
    const status = body.status;
    const exists = lead.scopeStatuses.some((entry) => entry.scopeId === scopeId);
    const scopeStatuses = exists
      ? lead.scopeStatuses.map((entry) => entry.scopeId === scopeId ? { ...entry, status } : entry)
      : [...lead.scopeStatuses, { scopeId, status }];

    const updated = { ...lead, scopeStatuses, updatedAt: new Date().toISOString() };
    await saveTradeLead(updated);

    return Response.json({ ok: true, scopeStatuses });
  } catch (error) {
    const unavailable = error instanceof Error && error.message === "TRADE_STORE_NOT_CONFIGURED";
    return Response.json(
      { error: unavailable ? "Trade lead storage is not configured." : "Could not update the room status." },
      { status: 503 }
    );
  }
}
