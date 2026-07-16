import "server-only";

import { Resend } from "resend";
import type { TradeLead } from "@/lib/trade-leads";

const NOTIFY_TO = process.env.TRADE_LEAD_NOTIFY_EMAIL || "inquiries@steinheim-eg.com";
const NOTIFY_FROM = process.env.TRADE_LEAD_NOTIFY_FROM || "Steinheim Trade Studio <onboarding@resend.dev>";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmtCurrency(value: number) {
  return `LE ${Math.round(value).toLocaleString("en-US")}`;
}

function buildEmailHtml(lead: TradeLead): string {
  const d = lead.project.details;
  const priorityColor = lead.priority === "hot" ? "#b3441f" : lead.priority === "warm" ? "#946b1f" : "#6b6b66";

  const detailRows: Array<[string, string]> = [
    ["Contact", d.contactName || "—"],
    ["Company", d.company || "—"],
    ["Role", d.role || "—"],
    ["Email", d.email || "—"],
    ["Phone", d.phone || "—"],
    ["Project type", d.projectType || "—"],
    ["Location", d.location || "—"],
    ["Timeline", d.timeline || "—"],
  ];

  const detailRowsHtml = detailRows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#6b6b66;font-size:12px;white-space:nowrap;">${escapeHtml(label)}</td><td style="padding:4px 0;font-size:13px;color:#1a1a1a;">${escapeHtml(value)}</td></tr>`
    )
    .join("");

  const scopeRowsHtml = lead.scopeBreakdown
    .map(
      (scope) =>
        `<tr>
          <td style="padding:8px 12px 8px 0;border-bottom:1px solid #e8e6e0;font-size:13px;color:#1a1a1a;">
            <strong>${escapeHtml(scope.scopeName)}</strong><br/>
            <span style="color:#6b6b66;font-size:11px;">${escapeHtml(scope.scopeSummary)}</span>
          </td>
          <td style="padding:8px 0;border-bottom:1px solid #e8e6e0;font-size:13px;color:#1a1a1a;text-align:right;white-space:nowrap;">
            ${scope.totalUnits} units<br/>
            <span style="color:#6b6b66;font-size:11px;">${fmtCurrency(scope.retailReferenceTotal)}</span>
          </td>
        </tr>`
    )
    .join("");

  const riskFlagsHtml = lead.riskFlags.length
    ? `<p style="margin:16px 0 4px;font-size:12px;color:#946b1f;"><strong>Flags:</strong> ${lead.riskFlags.map(escapeHtml).join(" · ")}</p>`
    : "";

  return `
  <div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;">
    <div style="background:#141414;padding:20px 24px;">
      <p style="margin:0;color:#a8a8a4;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;">New trade lead</p>
      <h1 style="margin:6px 0 0;color:#fff;font-size:22px;font-weight:600;">${escapeHtml(d.projectName || "Untitled project")}</h1>
      <p style="margin:8px 0 0;color:#c9a86b;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">${lead.priority.toUpperCase()} · Score ${lead.score}/100</p>
    </div>

    <div style="padding:20px 24px;background:#fafaf8;">
      <table style="width:100%;border-collapse:collapse;">${detailRowsHtml}</table>
      ${riskFlagsHtml}
    </div>

    <div style="padding:20px 24px;">
      <p style="margin:0 0 10px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#6b6b66;">Room breakdown</p>
      <table style="width:100%;border-collapse:collapse;">${scopeRowsHtml}</table>
    </div>

    <div style="padding:16px 24px;background:#141414;">
      <table style="width:100%;">
        <tr>
          <td style="color:#fff;font-size:13px;">Total units: <strong>${lead.totalUnits}</strong></td>
          <td style="color:#fff;font-size:13px;text-align:right;">Retail reference: <strong>${fmtCurrency(lead.retailReferenceTotal)}</strong></td>
        </tr>
      </table>
    </div>

    ${d.notes ? `<div style="padding:16px 24px;border-top:1px solid #e8e6e0;"><p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#6b6b66;">Notes</p><p style="margin:0;font-size:13px;color:#1a1a1a;white-space:pre-wrap;">${escapeHtml(d.notes)}</p></div>` : ""}

    <div style="padding:16px 24px;border-top:1px solid #e8e6e0;">
      <p style="margin:0;font-size:11px;color:#6b6b66;">Reference ${escapeHtml(lead.reference)} · Submitted ${new Date(lead.submittedAt).toLocaleString("en-GB")}</p>
    </div>
  </div>`;
}

export async function sendTradeLeadNotification(lead: TradeLead) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: NOTIFY_FROM,
    to: NOTIFY_TO,
    replyTo: lead.project.details.email || undefined,
    subject: `New trade lead: ${lead.project.details.projectName || "Untitled"} (${lead.priority.toUpperCase()})`,
    html: buildEmailHtml(lead),
  });
}
