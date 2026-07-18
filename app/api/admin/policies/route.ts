import { fetchShopPolicies, updateShopPolicy } from "@/lib/shopify-client";
import { isAdminRequest } from "@/lib/server/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const policies = await fetchShopPolicies();
    return Response.json({ policies }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Failed to fetch Shopify policies:", error);
    return Response.json({ error: "Could not load policies." }, { status: 502 });
  }
}

export async function PATCH(request: Request) {
  if (!isAdminRequest(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    if (!body.type || body.body === undefined) return Response.json({ error: "Invalid request." }, { status: 400 });
    const policy = await updateShopPolicy(body.type, body.body);
    return Response.json({ policy });
  } catch (error) {
    console.error("Failed to update Shopify policy:", error);
    return Response.json({ error: "Could not save this policy to Shopify." }, { status: 502 });
  }
}
