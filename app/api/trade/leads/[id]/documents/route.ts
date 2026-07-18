import { randomUUID, timingSafeEqual } from "node:crypto";
import type { TradeLeadDocument } from "@/lib/trade-leads";
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

// Admin attaches a document (invoice, certificate, spec sheet...) to a lead.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!id) return Response.json({ error: "A lead id is required." }, { status: 400 });

  const body = await request.json().catch(() => null) as { label?: unknown; url?: unknown } | null;
  const label = typeof body?.label === "string" ? body.label.trim().slice(0, 120) : "";
  const url = typeof body?.url === "string" ? body.url.trim().slice(0, 500) : "";
  if (!label || !url) return Response.json({ error: "A label and link are required." }, { status: 400 });

  try {
    const lead = await getTradeLead(id);
    if (!lead) return Response.json({ error: "Not found." }, { status: 404 });

    const document: TradeLeadDocument = { id: randomUUID(), label, url, addedAt: new Date().toISOString() };
    const updated = { ...lead, documents: [...lead.documents, document], updatedAt: document.addedAt };
    await saveTradeLead(updated);

    return Response.json({ ok: true, documents: updated.documents });
  } catch (error) {
    const unavailable = error instanceof Error && error.message === "TRADE_STORE_NOT_CONFIGURED";
    return Response.json(
      { error: unavailable ? "Trade lead storage is not configured." : "Could not add the document." },
      { status: 503 }
    );
  }
}

// Admin removes a document.
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!id) return Response.json({ error: "A lead id is required." }, { status: 400 });

  const body = await request.json().catch(() => null) as { documentId?: unknown } | null;
  if (!body || typeof body.documentId !== "string") {
    return Response.json({ error: "A document id is required." }, { status: 400 });
  }

  try {
    const lead = await getTradeLead(id);
    if (!lead) return Response.json({ error: "Not found." }, { status: 404 });

    const documents = lead.documents.filter((entry) => entry.id !== body.documentId);
    const updated = { ...lead, documents, updatedAt: new Date().toISOString() };
    await saveTradeLead(updated);

    return Response.json({ ok: true, documents });
  } catch (error) {
    const unavailable = error instanceof Error && error.message === "TRADE_STORE_NOT_CONFIGURED";
    return Response.json(
      { error: unavailable ? "Trade lead storage is not configured." : "Could not remove the document." },
      { status: 503 }
    );
  }
}
