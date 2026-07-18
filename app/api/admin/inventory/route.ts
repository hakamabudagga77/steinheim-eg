import { setInventoryLevel } from "@/lib/shopify-client";
import { isAdminRequest } from "@/lib/server/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const { inventoryItemId, locationId, quantity } = body;
    if (!inventoryItemId || !locationId || quantity === undefined || quantity < 0) {
      return Response.json({ error: "Invalid request." }, { status: 400 });
    }
    await setInventoryLevel(Number(inventoryItemId), Number(locationId), Number(quantity));
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Failed to update Shopify inventory:", error);
    return Response.json({ error: "Could not save stock level to Shopify." }, { status: 502 });
  }
}
