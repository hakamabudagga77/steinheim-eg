import { randomUUID } from "node:crypto";
import { sanitizeTradeProject } from "@/lib/trade-project";
import { isTradeLeadStatus, type TradeLead } from "@/lib/trade-leads";
import { getTradeLead, listTradeLeads, saveTradeLead, updateTradeLead } from "@/lib/server/trade-lead-store";
import { sendTradeLeadConfirmationEmail, sendTradeLeadNotification, sendQuoteReadyNotification, sendStatusUpdateNotification } from "@/lib/server/trade-lead-email";
import { analyzeProject } from "@/lib/server/trade-lead-intelligence";
import { isAdminRequest } from "@/lib/server/admin-session";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { redisSetEx, redisGet } from "@/lib/server/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await checkRateLimit(request, "trade-leads", 5, 60 * 60))) {
    return Response.json({ error: "Too many submissions." }, { status: 429 });
  }
  if (Number(request.headers.get("content-length") || 0) > 120_000) {
    return Response.json({ error: "Request is too large." }, { status: 413 });
  }
  const body = await request.json().catch(() => null) as { project?: unknown; locale?: unknown; source?: unknown; website?: unknown; idempotencyKey?: unknown } | null;
  if (body?.website) return Response.json({ ok: true });
  const project = sanitizeTradeProject(body?.project);
  if (!project || !project.items.length || !project.details.projectName || !project.details.contactName || !/^\S+@\S+\.\S+$/.test(project.details.email)) {
    return Response.json({ error: "Project name, contact, email, and at least one valid product are required." }, { status: 400 });
  }

  // A client-generated idempotency key lets a retried submission (double
  // click, flaky network, browser back/forward) return the original result
  // instead of creating a second lead and sending duplicate notification
  // emails. The key is only meaningful for a few minutes around the
  // original request.
  const idempotencyKey = typeof body?.idempotencyKey === "string" ? body.idempotencyKey.slice(0, 100) : null;
  const idempotencyRedisKey = idempotencyKey ? `steinheim:idempotency:trade-lead:${idempotencyKey}` : null;
  if (idempotencyRedisKey) {
    const cached = await redisGet(idempotencyRedisKey).catch(() => null);
    if (cached) {
      try {
        return Response.json(JSON.parse(cached));
      } catch {
        // Fall through and process normally if the cached payload is unreadable.
      }
    }
  }

  const now = new Date();
  const id = randomUUID();
  const reference = `STM-LEAD-${now.toISOString().slice(0, 10).replace(/-/g, "")}-${id.slice(0, 6).toUpperCase()}`;
  const intelligence = analyzeProject(project);
  if (intelligence.lineCount !== project.items.length) {
    return Response.json({ error: "One or more products are no longer valid in the working catalogue." }, { status: 400 });
  }
  const lead: TradeLead = {
    id,
    reference,
    submittedAt: now.toISOString(),
    updatedAt: now.toISOString(),
    source: typeof body?.source === "string" ? body.source.slice(0, 80) : "interactive-catalogue",
    locale: body?.locale === "ar" ? "ar" : "en",
    status: "new",
    internalNotes: "",
    project: { ...project, status: "submitted", submittedLeadId: id, updatedAt: now.toISOString() },
    ...intelligence,
    messages: [],
    sampleRequests: [],
    documents: [],
    scopeStatuses: [],
    quoteHistory: [],
  };
  try {
    await saveTradeLead(lead);
  } catch (error) {
    const unavailable = error instanceof Error && error.message === "TRADE_STORE_NOT_CONFIGURED";
    return Response.json(
      { error: unavailable ? "Trade lead storage is not configured." : "The lead could not be saved." },
      { status: 503 }
    );
  }
  try {
    await sendTradeLeadNotification(lead);
  } catch (error) {
    console.error("Trade lead notification email failed:", error);
  }
  try {
    await sendTradeLeadConfirmationEmail(lead);
  } catch (error) {
    console.error("Trade lead confirmation email failed:", error);
  }
  const responseBody = { ok: true, id: lead.id, reference: lead.reference, priority: lead.priority, completion: lead.completion };
  if (idempotencyRedisKey) {
    await redisSetEx(idempotencyRedisKey, 10 * 60, JSON.stringify(responseBody)).catch(() => {});
  }
  return Response.json(responseBody);
}

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return Response.json({ leads: await listTradeLeads() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const unavailable = error instanceof Error && error.message === "TRADE_STORE_NOT_CONFIGURED";
    return Response.json({ error: unavailable ? "Trade lead storage is not configured." : "Could not load leads." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  if (!isAdminRequest(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null) as {
    id?: unknown;
    status?: unknown;
    internalNotes?: unknown;
    quoteUrl?: unknown;
    quoteAmount?: unknown;
    warrantyReference?: unknown;
  } | null;
  const hasQuoteField = typeof body?.quoteUrl === "string" || typeof body?.quoteAmount === "string";
  const hasWarrantyField = typeof body?.warrantyReference === "string";
  if (!body || typeof body.id !== "string" || (!isTradeLeadStatus(body.status) && typeof body.internalNotes !== "string" && !hasQuoteField && !hasWarrantyField)) {
    return Response.json({ error: "A valid lead update is required." }, { status: 400 });
  }
  const update: Partial<TradeLead> = {};
  if (isTradeLeadStatus(body.status)) update.status = body.status;
  if (typeof body.internalNotes === "string") update.internalNotes = body.internalNotes.trim().slice(0, 3000);
  if (typeof body.quoteUrl === "string") update.quoteUrl = body.quoteUrl.trim().slice(0, 500);
  if (typeof body.quoteAmount === "string") update.quoteAmount = body.quoteAmount.trim().slice(0, 100);
  if (typeof body.warrantyReference === "string") update.warrantyReference = body.warrantyReference.trim().slice(0, 500);

  const needsBefore = hasQuoteField || isTradeLeadStatus(body.status);
  const before = needsBefore ? await getTradeLead(body.id) : null;

  if (hasQuoteField && before && (before.quoteUrl || before.quoteAmount)) {
    const urlChanged = update.quoteUrl !== undefined && update.quoteUrl !== (before.quoteUrl ?? "");
    const amountChanged = update.quoteAmount !== undefined && update.quoteAmount !== (before.quoteAmount ?? "");
    if (urlChanged || amountChanged) {
      const revision = { url: before.quoteUrl, amount: before.quoteAmount, changedAt: new Date().toISOString() };
      update.quoteHistory = [...before.quoteHistory, revision].slice(-20);
    }
  }

  const lead = await updateTradeLead(body.id, update);
  if (!lead) return Response.json({ error: "Lead not found." }, { status: 404 });

  if (hasQuoteField && lead.quoteUrl && lead.quoteUrl !== before?.quoteUrl) {
    try {
      await sendQuoteReadyNotification(lead);
    } catch (error) {
      console.error("Quote ready notification email failed:", error);
    }
  }

  if (isTradeLeadStatus(body.status) && lead.status !== before?.status) {
    try {
      await sendStatusUpdateNotification(lead, lead.status);
    } catch (error) {
      console.error("Status update notification email failed:", error);
    }
  }

  return Response.json({ lead });
}
