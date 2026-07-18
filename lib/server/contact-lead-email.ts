import "server-only";

import { Resend } from "resend";
import type { ContactLead } from "@/lib/contact-leads";

const NOTIFY_TO = process.env.TRADE_LEAD_NOTIFY_EMAIL || "inquiries@steinheim-eg.com";
const NOTIFY_FROM = process.env.TRADE_LEAD_NOTIFY_FROM || "Steinheim Egypt <onboarding@resend.dev>";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendContactLeadNotification(lead: ContactLead) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const resend = new Resend(apiKey);
  const rows: Array<[string, string]> = [
    ["Type", lead.enquiryType],
    ["Name", lead.name],
    ["Email", lead.email],
    ["Phone", lead.phone || "—"],
    [lead.enquiryType === "homeowner" ? "City" : "Company", lead.cityOrCompany || "—"],
    ["Subject", lead.subject || "—"],
  ];
  const rowsHtml = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#6b6b66;font-size:12px;white-space:nowrap;">${escapeHtml(label)}</td><td style="padding:4px 0;font-size:13px;color:#1a1a1a;">${escapeHtml(value)}</td></tr>`
    )
    .join("");

  await resend.emails.send({
    from: NOTIFY_FROM,
    to: NOTIFY_TO,
    replyTo: lead.email || undefined,
    subject: `New contact enquiry: ${lead.name}${lead.subject ? ` — ${lead.subject}` : ""}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;">
        <h2 style="font-size:16px;margin:0 0 12px;">New contact form enquiry</h2>
        <table>${rowsHtml}</table>
        <p style="margin-top:16px;font-size:13px;color:#1a1a1a;white-space:pre-wrap;">${escapeHtml(lead.message)}</p>
      </div>
    `,
  });
}
