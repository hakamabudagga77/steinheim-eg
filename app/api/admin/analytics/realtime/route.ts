import { fetchGA4Realtime } from "@/lib/server/ga4-client";
import { isAdminRequest } from "@/lib/server/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const realtime = await fetchGA4Realtime();
    return Response.json({ realtime }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "GA4_NOT_CONFIGURED" || message === "GA4_PROPERTY_ID_NOT_CONFIGURED") {
      return Response.json({ error: "GA4 dashboard is not configured yet." }, { status: 503 });
    }
    console.error("Failed to fetch GA4 realtime data:", error);
    return Response.json({ error: "Could not load realtime data." }, { status: 502 });
  }
}
