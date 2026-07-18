import { fetchOrders } from "@/lib/shopify-client";
import { isAdminRequest } from "@/lib/server/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const orders = await fetchOrders();
    return Response.json({ orders }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Failed to fetch Shopify orders:", error);
    return Response.json(
      { error: "Could not load orders. The connected Shopify app may not have the read_orders scope yet." },
      { status: 502 }
    );
  }
}
