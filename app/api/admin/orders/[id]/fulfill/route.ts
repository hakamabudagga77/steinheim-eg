import { fetchFulfillmentOrders, createFulfillment } from "@/lib/shopify-client";
import { isAdminRequest } from "@/lib/server/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const body = await request.json().catch(() => ({}));
    const fulfillmentOrders = await fetchFulfillmentOrders(Number(id));
    const open = fulfillmentOrders.filter((fo) => fo.status === "open" || fo.status === "in_progress");
    if (open.length === 0) {
      return Response.json({ error: "No open fulfillment orders — this order may already be fulfilled." }, { status: 400 });
    }
    for (const fo of open) {
      await createFulfillment(fo.id, {
        trackingNumber: body.trackingNumber || undefined,
        trackingCompany: body.trackingCompany || undefined,
        trackingUrl: body.trackingUrl || undefined,
        notifyCustomer: Boolean(body.notifyCustomer),
      });
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Failed to fulfill Shopify order:", error);
    return Response.json({ error: "Could not mark this order fulfilled in Shopify." }, { status: 502 });
  }
}
