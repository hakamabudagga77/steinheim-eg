import { listTradeLeads } from "@/lib/server/trade-lead-store";
import { sendTradeLeadLinkReminderEmail } from "@/lib/server/trade-lead-email";
import { checkRateLimit } from "@/lib/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Deliberately always returns the same generic response, match or not —
// this is a public, unauthenticated lookup by email, so it must not be
// usable to figure out which addresses have a trade project on file.
export async function POST(request: Request) {
  if (!(await checkRateLimit(request, "trade-leads-resend-link", 5, 60 * 60))) {
    return Response.json({ ok: true });
  }

  const body = await request.json().catch(() => null) as { email?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return Response.json({ ok: true });
  }

  try {
    const leads = await listTradeLeads();
    const matches = leads
      .filter((lead) => !lead.archivedAt && lead.project.details.email?.trim().toLowerCase() === email)
      .slice(0, 5);
    await Promise.all(matches.map((lead) => sendTradeLeadLinkReminderEmail(lead).catch(() => {})));
  } catch {
    // Store unavailable — still return the generic response below.
  }

  return Response.json({ ok: true });
}
