import { fetchAllProducts } from "@/lib/shopify-client";
import { isAdminRequest } from "@/lib/server/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const products = await fetchAllProducts();
    return Response.json({ products }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Failed to fetch Shopify products:", error);
    return Response.json({ error: "Could not load products." }, { status: 502 });
  }
}
