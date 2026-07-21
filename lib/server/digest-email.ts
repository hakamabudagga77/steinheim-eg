import "server-only";

import { Resend } from "resend";
import { fetchOrders, fetchAllProducts } from "@/lib/shopify-client";
import { listContactLeads } from "@/lib/server/contact-lead-store";
import { listTradeLeads } from "@/lib/server/trade-lead-store";
import { fetchGA4Summary } from "@/lib/server/ga4-client";

const NOTIFY_TO = process.env.DIGEST_NOTIFY_EMAIL || process.env.TRADE_LEAD_NOTIFY_EMAIL || "inquiries@steinheim-eg.com";
const NOTIFY_FROM = process.env.TRADE_LEAD_NOTIFY_FROM || "Steinheim Admin <onboarding@resend.dev>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://steinheim-eg.com";
const LOW_STOCK_THRESHOLD = 10;

function row(label: string, value: string) {
  return `<tr>
    <td style="padding:10px 16px;border-bottom:1px solid #e8e6e0;font-size:13px;color:#6b6b66;">${label}</td>
    <td style="padding:10px 16px;border-bottom:1px solid #e8e6e0;font-size:14px;color:#1a1a1a;font-weight:600;text-align:right;">${value}</td>
  </tr>`;
}

export async function buildAndSendDailyDigest(): Promise<{ sent: boolean; reason?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false, reason: "RESEND_API_KEY not configured" };

  const since = Date.now() - 24 * 60 * 60 * 1000;

  const [orders, products, contactLeads, tradeLeads, ga4] = await Promise.all([
    fetchOrders().catch(() => []),
    fetchAllProducts().catch(() => []),
    listContactLeads().catch(() => []),
    listTradeLeads().catch(() => []),
    fetchGA4Summary("yesterday", "yesterday").catch(() => null),
  ]);

  const recentOrders = orders.filter((o) => new Date(o.created_at).getTime() >= since && o.financial_status !== "voided");
  const revenue = recentOrders.reduce((sum, o) => sum + Number(o.total_price || 0), 0);
  const currency = recentOrders[0]?.currency ?? orders[0]?.currency ?? "EGP";

  const newContactLeads = contactLeads.filter((l) => new Date(l.submittedAt).getTime() >= since);
  const newTradeLeads = tradeLeads.filter((l) => new Date(l.submittedAt).getTime() >= since);
  const hotTradeLeads = newTradeLeads.filter((l) => l.priority === "hot");

  const lowStock = products.flatMap((p) => p.variants.filter((v) => v.inventory_quantity <= LOW_STOCK_THRESHOLD));

  const rows = [
    row("Revenue · last 24h", `${currency} ${revenue.toLocaleString("en-US", { maximumFractionDigits: 0 })}`),
    row("Orders · last 24h", `${recentOrders.length}`),
    row("New contact leads", `${newContactLeads.length}`),
    row("New trade leads", `${newTradeLeads.length}${hotTradeLeads.length ? ` (${hotTradeLeads.length} hot)` : ""}`),
    row("Low stock variants", `${lowStock.length}`),
  ];
  if (ga4) {
    rows.push(row("Visitors · yesterday", `${ga4.activeUsers}`));
  }

  const leadRowsHtml = newTradeLeads
    .slice(0, 5)
    .map(
      (lead) =>
        `<tr><td style="padding:8px 16px;border-bottom:1px solid #e8e6e0;font-size:13px;color:#1a1a1a;">${
          lead.project.details.projectName || "Untitled"
        } — ${lead.project.details.company || "—"}</td><td style="padding:8px 16px;border-bottom:1px solid #e8e6e0;font-size:12px;color:#6b6b66;text-align:right;text-transform:uppercase;">${lead.priority}</td></tr>`
    )
    .join("");

  const html = `
    <div style="font-family:Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;">
      <div style="background:#0a0a0b;padding:24px 28px;">
        <p style="margin:0;color:#0a84ff;font-size:10px;letter-spacing:2px;text-transform:uppercase;">Steinheim Egypt</p>
        <h1 style="margin:6px 0 0;color:#fff;font-size:22px;font-family:Georgia,serif;">Daily digest</h1>
        <p style="margin:6px 0 0;color:rgba(255,255,255,0.4);font-size:12px;">${new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</p>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-top:8px;">${rows.join("")}</table>
      ${
        newTradeLeads.length > 0
          ? `<div style="margin-top:20px;">
              <p style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#6b6b66;padding:0 16px;">New trade leads</p>
              <table style="width:100%;border-collapse:collapse;">${leadRowsHtml}</table>
            </div>`
          : ""
      }
      <div style="padding:20px 16px;">
        <a href="${SITE_URL}/admin" style="display:inline-block;background:#0a84ff;color:#000;text-decoration:none;padding:10px 20px;border-radius:24px;font-size:13px;font-weight:600;">Open admin →</a>
      </div>
    </div>
  `;

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: NOTIFY_FROM,
    to: NOTIFY_TO,
    subject: `Steinheim daily digest — ${recentOrders.length} orders, ${newContactLeads.length + newTradeLeads.length} new leads`,
    html,
  });

  return { sent: true };
}
