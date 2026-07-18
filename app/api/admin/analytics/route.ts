import { fetchGA4Summary } from "@/lib/server/ga4-client";
import { isAdminRequest } from "@/lib/server/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const startDate = url.searchParams.get("start") || "30daysAgo";
  const endDate = url.searchParams.get("end") || "today";

  try {
    const summary = await fetchGA4Summary(startDate, endDate);
    return Response.json({ summary }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "GA4_NOT_CONFIGURED" || message === "GA4_PROPERTY_ID_NOT_CONFIGURED") {
      return Response.json({ error: "GA4 dashboard is not configured yet." }, { status: 503 });
    }
    console.error("Failed to fetch GA4 summary:", error);
    return Response.json({ error: "Could not load analytics data." }, { status: 502 });
  }
}
