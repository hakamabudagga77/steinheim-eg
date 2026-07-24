import { after } from "next/server";
import { listTradeLeads } from "@/lib/server/trade-lead-store";
import { sendTradeLeadLinkReminderEmail } from "@/lib/server/trade-lead-email";
import { checkRateLimit } from "@/lib/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Deliberately always returns the same generic response, match or not —
// this is a public, unauthenticated lookup by email, so it must not be
// usable to figure out which addresses have a trade project on file.
//
// The lookup + email send run in after(), i.e. AFTER the response is
// already flushed, so response latency is constant regardless of whether a
// match was found. Awaiting the sends before responding would leak
// existence through timing (match => Resend round-trip => slower reply).
export async function POST(request: Request) {
  if (!(await checkRateLimit(request, "trade-leads-resend-link", 5, 60 * 60))) {
    return Response.json({ ok: true });
  }

  const body = await request.json().catch(() => null) as { email?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase().slice(0, 200) : "";
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return Response.json({ ok: true });
  }

  after(async () => {
    try {
      const leads = await listTradeLeads();
      const matches = leads
        .filter((lead) => !lead.archivedAt && lead.project.details.email?.trim().toLowerCase() === email)
        .slice(0, 5);
      await Promise.all(matches.map((lead) => sendTradeLeadLinkReminderEmail(lead).catch(() => {})));
    } catch {
      // Store unavailable — nothing to do; the generic response already went out.
    }
  });

  return Response.json({ ok: true });
}
