import "server-only";

import { Resend } from "resend";
import type { RestockAlertSubscription } from "@/lib/restock-alerts";
import { formatPrice, getFinishById, getProductBySlug, getSeriesById } from "@/lib/utils";

const NOTIFY_FROM = process.env.TRADE_LEAD_NOTIFY_FROM || "Steinheim Egypt <onboarding@resend.dev>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://steinheim-eg.com";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendRestockAlertEmail(
  subscription: RestockAlertSubscription,
  reason: "back-in-stock" | "price-drop",
  currentPrice: number
) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const product = getProductBySlug(subscription.productSlug);
  if (!product) return;
  const finish = getFinishById(subscription.finish);
  const series = getSeriesById(product.series);
  const productName = `${series?.name ?? product.series} ${product.name}`;
  const productUrl = `${SITE_URL}/en/products/${subscription.productSlug}`;

  const headline =
    reason === "back-in-stock"
      ? "Good news — it's back in stock"
      : "Good news — the price dropped";

  const body =
    reason === "back-in-stock"
      ? `<strong>${escapeHtml(productName)}</strong> in ${escapeHtml(finish?.name ?? subscription.finish)} is back in stock at ${escapeHtml(formatPrice(currentPrice))}.`
      : `<strong>${escapeHtml(productName)}</strong> in ${escapeHtml(finish?.name ?? subscription.finish)} is now ${escapeHtml(formatPrice(currentPrice))}, down from ${escapeHtml(formatPrice(subscription.priceAtSubscription))} when you subscribed.`;

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: NOTIFY_FROM,
    to: subscription.email,
    subject: `${headline} — ${productName}`,
    html: `
      <div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;">
        <div style="background:#141414;padding:20px 24px;">
          <p style="margin:0;color:#a8a8a4;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;">Steinheim Egypt</p>
          <h1 style="margin:6px 0 0;color:#fff;font-size:20px;font-weight:600;">${headline}</h1>
        </div>
        <div style="padding:20px 24px;background:#fafaf8;">
          <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#1a1a1a;">${body}</p>
          <a href="${productUrl}" style="display:inline-block;background:#141414;color:#fff;text-decoration:none;padding:12px 22px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;">
            View product
          </a>
        </div>
      </div>
    `,
  });
}
