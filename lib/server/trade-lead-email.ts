import "server-only";

import { Resend } from "resend";
import { TRADE_LEAD_STATUS_COPY, TRADE_LEAD_STATUS_LABELS, type TradeLead, type TradeLeadDeliveryDetails, type TradeLeadMessage, type TradeLeadSampleRequest, type TradeLeadStatus } from "@/lib/trade-leads";
import { TRADE_PERSONA_LABELS } from "@/lib/trade-project";

const NOTIFY_TO = process.env.TRADE_LEAD_NOTIFY_EMAIL || "inquiries@steinheim-eg.com";
const NOTIFY_FROM = process.env.TRADE_LEAD_NOTIFY_FROM || "Steinheim Trade Studio <onboarding@resend.dev>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://steinheim-eg.com";

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
  // Tuned for legibility on the dark #141414 header band below, not the light body background.
  const priorityColor = lead.priority === "hot" ? "#ff6b4a" : lead.priority === "warm" ? "#e8c073" : "#9a9a94";

  const detailRows: Array<[string, string]> = [
    ["Contact", d.contactName || "—"],
    ["Company", d.company || "—"],
    ["Role", d.role || "—"],
    ["Email", d.email || "—"],
    ["Phone", d.phone || "—"],
    ["Business type", lead.project.persona ? TRADE_PERSONA_LABELS[lead.project.persona] : d.projectType || "—"],
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
      <p style="margin:8px 0 0;color:${priorityColor};font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">${lead.priority.toUpperCase()} · Score ${lead.score}/100</p>
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

export async function sendTradeLeadUpdateNotification(lead: TradeLead) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: NOTIFY_FROM,
    to: NOTIFY_TO,
    replyTo: lead.project.details.email || undefined,
    subject: `Updated selection: ${lead.project.details.projectName || "Untitled"} (${lead.reference})`,
    html: buildEmailHtml(lead),
  });
}

function buildConfirmationEmailHtml(lead: TradeLead, restoreLink: string): string {
  const d = lead.project.details;
  return `
  <div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;">
    <div style="background:#141414;padding:20px 24px;">
      <p style="margin:0;color:#a8a8a4;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;">Steinheim Trade Studio</p>
      <h1 style="margin:6px 0 0;color:#fff;font-size:22px;font-weight:600;">Thanks, ${escapeHtml(d.contactName || "there")}</h1>
    </div>
    <div style="padding:20px 24px;background:#fafaf8;">
      <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#1a1a1a;">
        We've received <strong>${escapeHtml(d.projectName || "your project")}</strong> and our team will follow up with trade pricing within 24 hours.
      </p>
      <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#1a1a1a;">
        Bookmark this link — it brings your project, product selections, and message thread with Steinheim back on any device, any time, even if you clear your browser:
      </p>
      <a href="${restoreLink}" style="display:inline-block;background:#141414;color:#fff;text-decoration:none;padding:12px 22px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;">
        Open your project
      </a>
    </div>
    <div style="padding:16px 24px;border-top:1px solid #e8e6e0;">
      <p style="margin:0;font-size:11px;color:#6b6b66;">Reference ${escapeHtml(lead.reference)}</p>
    </div>
  </div>`;
}

export async function sendTradeLeadConfirmationEmail(lead: TradeLead) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !lead.project.details.email) return;

  const resend = new Resend(apiKey);
  const restoreLink = `${SITE_URL}/${lead.locale}/trade/restore/${lead.id}`;
  await resend.emails.send({
    from: NOTIFY_FROM,
    to: lead.project.details.email,
    subject: `We've received your project — ${lead.project.details.projectName || "Steinheim"}`,
    html: buildConfirmationEmailHtml(lead, restoreLink),
  });
}

function buildLinkReminderEmailHtml(lead: TradeLead, restoreLink: string): string {
  const d = lead.project.details;
  return `
  <div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;">
    <div style="background:#141414;padding:20px 24px;">
      <p style="margin:0;color:#a8a8a4;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;">Steinheim Trade Studio</p>
      <h1 style="margin:6px 0 0;color:#fff;font-size:22px;font-weight:600;">Here's your project link</h1>
    </div>
    <div style="padding:20px 24px;background:#fafaf8;">
      <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#1a1a1a;">
        As requested, here's the link back to <strong>${escapeHtml(d.projectName || "your project")}</strong> — status, quotes, documents, and your message thread with Steinheim.
      </p>
      <a href="${restoreLink}" style="display:inline-block;background:#141414;color:#fff;text-decoration:none;padding:12px 22px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;">
        Open your project
      </a>
    </div>
    <div style="padding:16px 24px;border-top:1px solid #e8e6e0;">
      <p style="margin:0;font-size:11px;color:#6b6b66;">Reference ${escapeHtml(lead.reference)}</p>
    </div>
  </div>`;
}

export async function sendTradeLeadLinkReminderEmail(lead: TradeLead) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !lead.project.details.email) return;

  const resend = new Resend(apiKey);
  const restoreLink = `${SITE_URL}/${lead.locale}/trade/restore/${lead.id}`;
  await resend.emails.send({
    from: NOTIFY_FROM,
    to: lead.project.details.email,
    subject: `Your Steinheim project link — ${lead.project.details.projectName || "Steinheim"}`,
    html: buildLinkReminderEmailHtml(lead, restoreLink),
  });
}

function buildMessageEmailHtml(lead: TradeLead, message: TradeLeadMessage): string {
  const projectName = lead.project.details.projectName || "Untitled project";
  const senderLabel = message.from === "customer" ? (lead.project.details.contactName || "The client") : "Steinheim";
  return `
  <div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;">
    <div style="background:#141414;padding:20px 24px;">
      <p style="margin:0;color:#a8a8a4;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;">
        ${message.from === "customer" ? "New message from client" : "New message from Steinheim"}
      </p>
      <h1 style="margin:6px 0 0;color:#fff;font-size:20px;font-weight:600;">${escapeHtml(projectName)}</h1>
    </div>
    <div style="padding:20px 24px;background:#fafaf8;">
      <p style="margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#6b6b66;">${escapeHtml(senderLabel)}</p>
      <p style="margin:0;font-size:14px;line-height:1.6;color:#1a1a1a;white-space:pre-wrap;">${escapeHtml(message.body)}</p>
    </div>
    <div style="padding:16px 24px;border-top:1px solid #e8e6e0;">
      <p style="margin:0;font-size:11px;color:#6b6b66;">Reference ${escapeHtml(lead.reference)}</p>
    </div>
  </div>`;
}

function buildQuoteReadyEmailHtml(lead: TradeLead): string {
  const d = lead.project.details;
  const restoreLink = `${SITE_URL}/${lead.locale}/trade/restore/${lead.id}`;
  return `
  <div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;">
    <div style="background:#141414;padding:20px 24px;">
      <p style="margin:0;color:#a8a8a4;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;">Steinheim Trade Studio</p>
      <h1 style="margin:6px 0 0;color:#fff;font-size:22px;font-weight:600;">Your trade quote is ready</h1>
    </div>
    <div style="padding:20px 24px;background:#fafaf8;">
      <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#1a1a1a;">
        We've prepared trade pricing for <strong>${escapeHtml(d.projectName || "your project")}</strong>${lead.quoteAmount ? ` — <strong>${escapeHtml(lead.quoteAmount)}</strong>` : ""}.
      </p>
      <a href="${restoreLink}" style="display:inline-block;background:#141414;color:#fff;text-decoration:none;padding:12px 22px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;">
        View your quote
      </a>
    </div>
    <div style="padding:16px 24px;border-top:1px solid #e8e6e0;">
      <p style="margin:0;font-size:11px;color:#6b6b66;">Reference ${escapeHtml(lead.reference)}</p>
    </div>
  </div>`;
}

export async function sendQuoteReadyNotification(lead: TradeLead) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !lead.project.details.email) return;

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: NOTIFY_FROM,
    to: lead.project.details.email,
    subject: `Your trade quote is ready — ${lead.project.details.projectName || "Steinheim"}`,
    html: buildQuoteReadyEmailHtml(lead),
  });
}

export async function sendQuoteAcceptedNotification(lead: TradeLead) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const resend = new Resend(apiKey);
  const projectName = lead.project.details.projectName || "Untitled project";
  await resend.emails.send({
    from: NOTIFY_FROM,
    to: NOTIFY_TO,
    replyTo: lead.project.details.email || undefined,
    subject: `Quote accepted: ${projectName} (${lead.reference})`,
    html: `
    <div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;">
      <div style="background:#141414;padding:20px 24px;">
        <p style="margin:0;color:#a8a8a4;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;">Quote accepted</p>
        <h1 style="margin:6px 0 0;color:#fff;font-size:20px;font-weight:600;">${escapeHtml(projectName)}</h1>
      </div>
      <div style="padding:20px 24px;background:#fafaf8;">
        <p style="margin:0;font-size:14px;line-height:1.6;color:#1a1a1a;">
          ${escapeHtml(lead.project.details.contactName || "The client")} accepted the trade quote${lead.quoteAmount ? ` (${escapeHtml(lead.quoteAmount)})` : ""}.
        </p>
      </div>
      <div style="padding:16px 24px;border-top:1px solid #e8e6e0;">
        <p style="margin:0;font-size:11px;color:#6b6b66;">Reference ${escapeHtml(lead.reference)}</p>
      </div>
    </div>`,
  });
}

export async function sendSampleRequestNotification(lead: TradeLead, request: TradeLeadSampleRequest) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const resend = new Resend(apiKey);
  const projectName = lead.project.details.projectName || "Untitled project";
  await resend.emails.send({
    from: NOTIFY_FROM,
    to: NOTIFY_TO,
    replyTo: lead.project.details.email || undefined,
    subject: `Sample request: ${projectName} (${lead.reference})`,
    html: `
    <div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;">
      <div style="background:#141414;padding:20px 24px;">
        <p style="margin:0;color:#a8a8a4;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;">New sample request</p>
        <h1 style="margin:6px 0 0;color:#fff;font-size:20px;font-weight:600;">${escapeHtml(projectName)}</h1>
      </div>
      <div style="padding:20px 24px;background:#fafaf8;">
        <p style="margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#6b6b66;">Samples requested</p>
        <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#1a1a1a;white-space:pre-wrap;">${escapeHtml(request.note)}</p>
        <p style="margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#6b6b66;">Deliver to</p>
        <p style="margin:0;font-size:14px;line-height:1.6;color:#1a1a1a;white-space:pre-wrap;">${escapeHtml(request.address)}</p>
      </div>
      <div style="padding:16px 24px;border-top:1px solid #e8e6e0;">
        <p style="margin:0;font-size:11px;color:#6b6b66;">Reference ${escapeHtml(lead.reference)}</p>
      </div>
    </div>`,
  });
}

export async function sendDeliveryDetailsNotification(lead: TradeLead, details: TradeLeadDeliveryDetails) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const resend = new Resend(apiKey);
  const projectName = lead.project.details.projectName || "Untitled project";
  await resend.emails.send({
    from: NOTIFY_FROM,
    to: NOTIFY_TO,
    replyTo: lead.project.details.email || undefined,
    subject: `Delivery details added: ${projectName} (${lead.reference})`,
    html: `
    <div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;">
      <div style="background:#141414;padding:20px 24px;">
        <p style="margin:0;color:#a8a8a4;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;">Delivery details</p>
        <h1 style="margin:6px 0 0;color:#fff;font-size:20px;font-weight:600;">${escapeHtml(projectName)}</h1>
      </div>
      <div style="padding:20px 24px;background:#fafaf8;">
        <p style="margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#6b6b66;">Site contact</p>
        <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#1a1a1a;">${escapeHtml(details.contactName)} · ${escapeHtml(details.contactPhone)}</p>
        ${details.accessNotes ? `<p style="margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#6b6b66;">Access notes</p><p style="margin:0;font-size:14px;line-height:1.6;color:#1a1a1a;white-space:pre-wrap;">${escapeHtml(details.accessNotes)}</p>` : ""}
      </div>
      <div style="padding:16px 24px;border-top:1px solid #e8e6e0;">
        <p style="margin:0;font-size:11px;color:#6b6b66;">Reference ${escapeHtml(lead.reference)}</p>
      </div>
    </div>`,
  });
}

export async function sendStatusUpdateNotification(lead: TradeLead, status: TradeLeadStatus) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !lead.project.details.email) return;

  const resend = new Resend(apiKey);
  const projectName = lead.project.details.projectName || "Untitled project";
  const restoreLink = `${SITE_URL}/${lead.locale}/trade/restore/${lead.id}`;
  await resend.emails.send({
    from: NOTIFY_FROM,
    to: lead.project.details.email,
    subject: `Project update: ${TRADE_LEAD_STATUS_LABELS[status]} — ${projectName}`,
    html: `
    <div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;">
      <div style="background:#141414;padding:20px 24px;">
        <p style="margin:0;color:#a8a8a4;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;">Steinheim Trade Studio</p>
        <h1 style="margin:6px 0 0;color:#fff;font-size:22px;font-weight:600;">${escapeHtml(TRADE_LEAD_STATUS_LABELS[status])}</h1>
      </div>
      <div style="padding:20px 24px;background:#fafaf8;">
        <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#1a1a1a;">
          ${escapeHtml(TRADE_LEAD_STATUS_COPY[status])}
        </p>
        <a href="${restoreLink}" style="display:inline-block;background:#141414;color:#fff;text-decoration:none;padding:12px 22px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;">
          View your project
        </a>
      </div>
      <div style="padding:16px 24px;border-top:1px solid #e8e6e0;">
        <p style="margin:0;font-size:11px;color:#6b6b66;">Reference ${escapeHtml(lead.reference)} · ${escapeHtml(projectName)}</p>
      </div>
    </div>`,
  });
}

export async function sendTradeMessageNotification(lead: TradeLead, message: TradeLeadMessage) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const resend = new Resend(apiKey);
  const html = buildMessageEmailHtml(lead, message);
  const projectName = lead.project.details.projectName || "Untitled project";

  if (message.from === "customer") {
    await resend.emails.send({
      from: NOTIFY_FROM,
      to: NOTIFY_TO,
      replyTo: lead.project.details.email || undefined,
      subject: `New message: ${projectName} (${lead.reference})`,
      html,
    });
  } else {
    if (!lead.project.details.email) return;
    await resend.emails.send({
      from: NOTIFY_FROM,
      to: lead.project.details.email,
      subject: `Steinheim replied: ${projectName}`,
      html,
    });
  }
}
