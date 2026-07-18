import { isAdminRequest } from "@/lib/server/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const redisConfigured = Boolean(
    (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL) &&
      (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN)
  );

  return Response.json({
    email: process.env.ADMIN_EMAIL || null,
    environment: process.env.NODE_ENV,
    services: [
      {
        name: "Shopify",
        configured: Boolean(
          process.env.SHOPIFY_STORE_DOMAIN && process.env.SHOPIFY_CLIENT_ID && process.env.SHOPIFY_CLIENT_SECRET
        ),
        detail: process.env.SHOPIFY_STORE_DOMAIN || null,
      },
      {
        name: "Website Analytics (GA4)",
        configured: Boolean(
          process.env.GA4_PROPERTY_ID && process.env.GA4_SERVICE_ACCOUNT_EMAIL && process.env.GA4_SERVICE_ACCOUNT_PRIVATE_KEY
        ),
        detail: process.env.GA4_PROPERTY_ID || null,
      },
      {
        name: "Lead storage (Redis)",
        configured: redisConfigured,
        detail: redisConfigured ? "Upstash Redis" : null,
      },
    ],
  });
}
