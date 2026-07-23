import { listPendingRestockAlerts, saveRestockAlert } from "@/lib/server/restock-alert-store";
import { sendRestockAlertEmail } from "@/lib/server/restock-alert-email";
import { getLiveProductData } from "@/lib/shopify-live-data";
import { isAdminRequest } from "@/lib/server/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorized(request: Request): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (secret && authHeader === `Bearer ${secret}`) return true;
  return isAdminRequest(request);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const pending = await listPendingRestockAlerts();
    let notified = 0;

    // Group by product to avoid refetching the same product's live data once per subscriber.
    const liveDataCache = new Map<string, Awaited<ReturnType<typeof getLiveProductData>>>();

    for (const subscription of pending) {
      if (!liveDataCache.has(subscription.productSlug)) {
        liveDataCache.set(subscription.productSlug, await getLiveProductData(subscription.productSlug));
      }
      const liveData = liveDataCache.get(subscription.productSlug);
      const liveVariant = liveData?.variants.find((v) => v.finish === subscription.finish);
      if (!liveVariant) continue;

      const backInStock = liveVariant.inStock;
      const priceDropped = liveVariant.price < subscription.priceAtSubscription;
      if (!backInStock && !priceDropped) continue;

      try {
        await sendRestockAlertEmail(subscription, backInStock ? "back-in-stock" : "price-drop", liveVariant.price);
        await saveRestockAlert({ ...subscription, notifiedAt: new Date().toISOString() });
        notified += 1;
      } catch (error) {
        console.error(`Restock alert email failed for ${subscription.email}:`, error);
      }
    }

    return Response.json({ checked: pending.length, notified });
  } catch (error) {
    console.error("Restock check failed:", error);
    return Response.json({ error: "Restock check failed." }, { status: 500 });
  }
}
