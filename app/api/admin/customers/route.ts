import { fetchCustomers, updateCustomer } from "@/lib/shopify-client";
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

export async function PATCH(request: Request) {
  if (!isAdminRequest(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const { customerId, phone, email, note } = body;
    if (!customerId) return Response.json({ error: "Invalid request." }, { status: 400 });
    const updates: { phone?: string; email?: string; note?: string } = {};
    if (phone !== undefined) updates.phone = phone;
    if (email !== undefined) updates.email = email;
    if (note !== undefined) updates.note = note;
    const customer = await updateCustomer(Number(customerId), updates);
    return Response.json({ customer });
  } catch (error) {
    console.error("Failed to update Shopify customer:", error);
    return Response.json({ error: "Could not save changes to Shopify." }, { status: 502 });
  }
}
