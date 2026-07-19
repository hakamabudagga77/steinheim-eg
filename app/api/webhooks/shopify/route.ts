import { createHmac, timingSafeEqual } from "node:crypto";
import { invalidateShopifyProductCache } from "@/lib/shopify-live-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Topics that mean "the price/stock data we serve to shoppers is stale".
// Order events don't change catalogue data directly, but a fulfillment or
// cancellation often does (restocks, backorders), so they're included too.
const CACHE_INVALIDATING_TOPICS = new Set([
  "products/update",
  "products/create",
  "products/delete",
  "inventory_levels/update",
  "inventory_levels/connect",
  "orders/create",
  "orders/cancelled",
  "orders/fulfilled",
]);

function verifySignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;

  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Shopify webhook receiver. Register this URL (https://<domain>/api/webhooks/shopify)
 * against the topics in CACHE_INVALIDATING_TOPICS in the Shopify admin
 * (Settings -> Notifications -> Webhooks), using the same signing secret
 * as SHOPIFY_WEBHOOK_SECRET. Every verified event simply drops the shared
 * product cache so the next storefront request re-fetches fresh prices
 * and stock -- turning the previous fixed 5-minute poll into a
 * near-real-time update without any extra load on Shopify's API.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-shopify-hmac-sha256");

  if (!verifySignature(rawBody, signature)) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  const topic = request.headers.get("x-shopify-topic") ?? "";

  if (CACHE_INVALIDATING_TOPICS.has(topic)) {
    await invalidateShopifyProductCache();
  }

  return Response.json({ ok: true });
}
