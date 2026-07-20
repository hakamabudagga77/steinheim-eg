import { randomUUID } from "node:crypto";
import { isContactLeadStatus, type ContactLead } from "@/lib/contact-leads";
import { listContactLeads, saveContactLead, updateContactLead } from "@/lib/server/contact-lead-store";
import { sendContactLeadNotification } from "@/lib/server/contact-lead-email";
import { isAdminRequest } from "@/lib/server/admin-session";
import { checkRateLimit } from "@/lib/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ENQUIRY_TYPES = ["homeowner", "trade", "general"] as const;

export async function POST(request: Request) {
  if (!(await checkRateLimit(request, "contact", 5, 60 * 60))) {
    return Response.json({ error: "Too many submissions." }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as {
    website?: unknown;
    enquiryType?: unknown;
    name?: unknown;
    email?: unknown;
    phone?: unknown;
    cityOrCompany?: unknown;
    subject?: unknown;
    message?: unknown;
  } | null;

  if (body?.website) return Response.json({ ok: true });

  const name = typeof body?.name === "string" ? body.name.trim().slice(0, 200) : "";
  const email = typeof body?.email === "string" ? body.email.trim().slice(0, 200) : "";
  const message = typeof body?.message === "string" ? body.message.trim().slice(0, 4000) : "";
  const enquiryType = ENQUIRY_TYPES.includes(body?.enquiryType as (typeof ENQUIRY_TYPES)[number])
    ? (body!.enquiryType as (typeof ENQUIRY_TYPES)[number])
    : "general";

  if (!name || !message || !/^\S+@\S+\.\S+$/.test(email)) {
    return Response.json({ error: "Name, a valid email, and a message are required." }, { status: 400 });
  }

  const lead: ContactLead = {
    id: randomUUID(),
    submittedAt: new Date().toISOString(),
    status: "new",
    enquiryType,
    name,
    email,
    phone: typeof body?.phone === "string" ? body.phone.trim().slice(0, 60) : "",
    cityOrCompany: typeof body?.cityOrCompany === "string" ? body.cityOrCompany.trim().slice(0, 200) : "",
    subject: typeof body?.subject === "string" ? body.subject.trim().slice(0, 300) : "",
    message,
  };

  try {
    await saveContactLead(lead);
  } catch (error) {
    const unavailable = error instanceof Error && error.message === "CONTACT_STORE_NOT_CONFIGURED";
    return Response.json(
      { error: unavailable ? "Contact lead storage is not configured." : "The message could not be saved." },
      { status: 503 }
    );
  }

  try {
    await sendContactLeadNotification(lead);
  } catch (error) {
    console.error("Contact lead notification email failed:", error);
  }

  return Response.json({ ok: true, id: lead.id });
}

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return Response.json({ leads: await listContactLeads() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const unavailable = error instanceof Error && error.message === "CONTACT_STORE_NOT_CONFIGURED";
    return Response.json({ error: unavailable ? "Contact lead storage is not configured." : "Could not load leads." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  if (!isAdminRequest(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { id?: unknown; status?: unknown } | null;
  if (!body || typeof body.id !== "string" || !isContactLeadStatus(body.status)) {
    return Response.json({ error: "A valid lead id and status are required." }, { status: 400 });
  }
  const lead = await updateContactLead(body.id, { status: body.status });
  if (!lead) return Response.json({ error: "Lead not found." }, { status: 404 });
  return Response.json({ lead });
}
