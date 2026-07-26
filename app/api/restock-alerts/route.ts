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
  if (Number(request.headers.get("content-length") || 0) > 20_000) {
    return Response.json({ error: "Request is too large." }, { status: 413 });
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

  try {
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
  } catch (error) {
    const unavailable = error instanceof Error && error.message === "RESTOCK_ALERT_STORE_NOT_CONFIGURED";
    return Response.json(
      { error: unavailable ? "Restock alert storage is not configured." : "The request could not be saved." },
      { status: 503 }
    );
  }

  return Response.json({ ok: true });
}
