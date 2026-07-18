import { sanitizeTradeProject } from "@/lib/trade-project";
import { getTradeLead, listTradeLeads, saveTradeLead } from "@/lib/server/trade-lead-store";
import { analyzeProject } from "@/lib/server/trade-lead-intelligence";
import { sendTradeLeadUpdateNotification } from "@/lib/server/trade-lead-email";

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

// Deliberately scoped: only the fields a customer visiting their own magic
// link should see. Admin-only intelligence (score, priority, riskFlags,
// internalNotes, scopeBreakdown) is never exposed here.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return Response.json({ error: "A lead id is required." }, { status: 400 });
  try {
    const lead = await getTradeLead(id);
    if (!lead) return Response.json({ error: "Not found." }, { status: 404 });

    // Same "the id is the capability token" trust boundary as the rest of this
    // lead — if someone has this lead's id, surfacing their other projects
    // under the same email is a reasonable extension, not a new exposure.
    const email = lead.project.details.email.trim().toLowerCase();
    let relatedProjects: Array<{ id: string; reference: string; projectName: string; status: string; submittedAt: string }> = [];
    if (email) {
      const allLeads = await listTradeLeads();
      relatedProjects = allLeads
        .filter((entry) => entry.id !== lead.id && entry.project.details.email.trim().toLowerCase() === email)
        .map((entry) => ({
          id: entry.id,
          reference: entry.reference,
          projectName: entry.project.details.projectName || "Untitled project",
          status: entry.status,
          submittedAt: entry.submittedAt,
        }));
    }

    return Response.json(
      {
        project: lead.project,
        reference: lead.reference,
        status: lead.status,
        quoteUrl: lead.quoteUrl,
        quoteAmount: lead.quoteAmount,
        quoteAcceptedAt: lead.quoteAcceptedAt,
        quoteHistory: lead.quoteHistory,
        sampleRequests: lead.sampleRequests,
        deliveryDetails: lead.deliveryDetails,
        documents: lead.documents,
        scopeStatuses: lead.scopeStatuses,
        warrantyReference: lead.warrantyReference,
        relatedProjects,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    const unavailable = error instanceof Error && error.message === "TRADE_STORE_NOT_CONFIGURED";
    return Response.json(
      { error: unavailable ? "Trade lead storage is not configured." : "Could not load project." },
      { status: 503 }
    );
  }
}

// Lets a customer push their current board (added products, edited details)
// back onto their already-submitted lead, instead of only ever being able to
// create a brand new one. Same "the id is the capability token" model as the
// messages endpoint — no admin key required.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return Response.json({ error: "A lead id is required." }, { status: 400 });
  if (!canUpdate(request)) {
    return Response.json({ error: "Too many updates. Try again shortly." }, { status: 429 });
  }
  if (Number(request.headers.get("content-length") || 0) > 120_000) {
    return Response.json({ error: "Request is too large." }, { status: 413 });
  }

  const body = await request.json().catch(() => null) as { project?: unknown } | null;
  const project = sanitizeTradeProject(body?.project);
  if (!project || !project.items.length) {
    return Response.json({ error: "At least one valid product is required." }, { status: 400 });
  }

  try {
    const lead = await getTradeLead(id);
    if (!lead) return Response.json({ error: "Not found." }, { status: 404 });

    const intelligence = analyzeProject(project);
    const now = new Date().toISOString();
    const updated = {
      ...lead,
      ...intelligence,
      project: { ...project, status: "submitted" as const, submittedLeadId: id, updatedAt: now },
      updatedAt: now,
    };
    await saveTradeLead(updated);

    try {
      await sendTradeLeadUpdateNotification(updated);
    } catch (error) {
      console.error("Trade lead update notification email failed:", error);
    }

    return Response.json({ ok: true, reference: updated.reference });
  } catch (error) {
    const unavailable = error instanceof Error && error.message === "TRADE_STORE_NOT_CONFIGURED";
    return Response.json(
      { error: unavailable ? "Trade lead storage is not configured." : "Could not update project." },
      { status: 503 }
    );
  }
}
