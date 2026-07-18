import { fetchCustomers } from "@/lib/shopify-client";
import { isAdminRequest } from "@/lib/server/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const customers = await fetchCustomers();
    return Response.json({ customers }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Failed to fetch Shopify customers:", error);
    return Response.json(
      { error: "Could not load customers. The connected Shopify app may not have the read_customers scope yet." },
      { status: 502 }
    );
  }
}
