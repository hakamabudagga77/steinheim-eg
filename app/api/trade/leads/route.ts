import { randomUUID, timingSafeEqual } from "node:crypto";
import productsData from "@/data/products.json";
import { getProjectCompletion, sanitizeTradeProject } from "@/lib/trade-project";
import { isTradeLeadStatus, type TradeLead, type TradeLeadPriority } from "@/lib/trade-leads";
import { listTradeLeads, saveTradeLead, updateTradeLead } from "@/lib/server/trade-lead-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const submitBuckets = new Map<string, { count: number; resetAt: number }>();

function clientKey(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
}

function canSubmit(request: Request) {
  const key = clientKey(request);
  const now = Date.now();
  const bucket = submitBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    submitBuckets.set(key, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true;
  }
  if (bucket.count >= 5) return false;
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

function analyzeProject(project: NonNullable<ReturnType<typeof sanitizeTradeProject>>) {
  const rows = project.items.flatMap((item) => {
    const product = productsData.products.find((entry) => entry.slug === item.slug);
    const variant = product?.variants.find((entry) => entry.finish === item.finish);
    return product && variant ? [{ item, variant }] : [];
  });
  const totalUnits = rows.reduce((sum, row) => sum + row.item.quantity, 0);
  const retailReferenceTotal = rows.reduce((sum, row) => sum + row.item.quantity * row.variant.price, 0);
  const completion = getProjectCompletion(project);
  const riskFlags = [
    !project.details.location && "Location missing",
    !project.details.timeline && "Required date missing",
    !project.details.phone && "Phone missing",
    !project.details.projectType && "Project type missing",
    totalUnits >= 50 && !project.details.notes && "Room mix / scope notes missing",
  ].filter((flag): flag is string => Boolean(flag));
  const scalePoints = totalUnits >= 250 ? 30 : totalUnits >= 100 ? 24 : totalUnits >= 25 ? 16 : totalUnits >= 5 ? 8 : 3;
  const score = Math.min(100, Math.round(20 + completion * 0.45 + scalePoints + (project.details.company ? 5 : 0)));
  const priority: TradeLeadPriority = score >= 78 || totalUnits >= 100 ? "hot" : score >= 55 ? "warm" : "exploratory";
  return { totalUnits, retailReferenceTotal, completion, riskFlags, score, priority, lineCount: rows.length };
}

export async function POST(request: Request) {
  if (!canSubmit(request)) return Response.json({ error: "Too many submissions." }, { status: 429 });
  if (Number(request.headers.get("content-length") || 0) > 120_000) {
    return Response.json({ error: "Request is too large." }, { status: 413 });
  }
  const body = await request.json().catch(() => null) as { project?: unknown; locale?: unknown; source?: unknown; website?: unknown } | null;
  if (body?.website) return Response.json({ ok: true });
  const project = sanitizeTradeProject(body?.project);
  if (!project || !project.items.length || !project.details.projectName || !project.details.contactName || !/^\S+@\S+\.\S+$/.test(project.details.email)) {
    return Response.json({ error: "Project name, contact, email, and at least one valid product are required." }, { status: 400 });
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
  return Response.json({ ok: true, id: lead.id, reference: lead.reference, priority: lead.priority, completion: lead.completion });
}

export async function GET(request: Request) {
  if (!isAdmin(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return Response.json({ leads: await listTradeLeads() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const unavailable = error instanceof Error && error.message === "TRADE_STORE_NOT_CONFIGURED";
    return Response.json({ error: unavailable ? "Trade lead storage is not configured." : "Could not load leads." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  if (!isAdmin(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null) as { id?: unknown; status?: unknown; internalNotes?: unknown } | null;
  if (!body || typeof body.id !== "string" || (!isTradeLeadStatus(body.status) && typeof body.internalNotes !== "string")) {
    return Response.json({ error: "A valid lead update is required." }, { status: 400 });
  }
  const update: Partial<TradeLead> = {};
  if (isTradeLeadStatus(body.status)) update.status = body.status;
  if (typeof body.internalNotes === "string") update.internalNotes = body.internalNotes.trim().slice(0, 3000);
  const lead = await updateTradeLead(body.id, update);
  return lead ? Response.json({ lead }) : Response.json({ error: "Lead not found." }, { status: 404 });
}
