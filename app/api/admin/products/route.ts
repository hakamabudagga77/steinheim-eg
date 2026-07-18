import { fetchAllProducts, updateProductStatus, updateVariantPrice } from "@/lib/shopify-client";
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

export async function PATCH(request: Request) {
  if (!isAdminRequest(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    if (body.productId && body.status) {
      const product = await updateProductStatus(Number(body.productId), body.status);
      return Response.json({ product });
    }
    if (body.variantId && body.price) {
      const variant = await updateVariantPrice(Number(body.variantId), String(body.price));
      return Response.json({ variant });
    }
    return Response.json({ error: "Invalid request." }, { status: 400 });
  } catch (error) {
    console.error("Failed to update Shopify product:", error);
    return Response.json({ error: "Could not save changes to Shopify." }, { status: 502 });
  }
}
