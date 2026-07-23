import { randomUUID } from "node:crypto";
import { sanitizeRestockAlertSubmission } from "@/lib/restock-alerts";
import { listPendingRestockAlerts, saveRestockAlert } from "@/lib/server/restock-alert-store";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { getProductBySlug } from "@/lib/utils";
import { getLiveProductData } from "@/lib/shopify-live-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await checkRateLimit(request, "restock-alerts", 10, 60 * 60))) {
    return Response.json({ error: "Too many requests." }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as { website?: unknown } | null;
  if (body && (body as { website?: unknown }).website) return Response.json({ ok: true });

  const submission = sanitizeRestockAlertSubmission(body);
  if (!submission) {
    return Response.json({ error: "A valid email, product, and finish are required." }, { status: 400 });
  }

  const product = getProductBySlug(submission.productSlug);
  const variant = product?.variants.find((v) => v.finish === submission.finish);
  if (!product || !variant) {
    return Response.json({ error: "That product could not be found." }, { status: 400 });
  }

  // Avoid piling up duplicate subscriptions if the shopper re-submits the same form.
  const pending = await listPendingRestockAlerts();
  const alreadySubscribed = pending.some(
    (entry) => entry.email === submission.email && entry.productSlug === submission.productSlug && entry.finish === submission.finish
  );
  if (alreadySubscribed) return Response.json({ ok: true });

  const liveData = await getLiveProductData(submission.productSlug);
  const liveVariant = liveData?.variants.find((v) => v.finish === submission.finish);
  const priceAtSubscription = liveVariant?.price ?? variant.price;

  await saveRestockAlert({
    id: randomUUID(),
    email: submission.email,
    productSlug: submission.productSlug,
    finish: submission.finish,
    priceAtSubscription,
    createdAt: new Date().toISOString(),
    notifiedAt: null,
  });

  return Response.json({ ok: true });
}
