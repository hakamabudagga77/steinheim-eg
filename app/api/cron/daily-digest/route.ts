import { buildAndSendDailyDigest } from "@/lib/server/digest-email";
import { isCronRequest } from "@/lib/server/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(request: Request) {
  if (!isCronRequest(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const result = await buildAndSendDailyDigest();
    return Response.json(result);
  } catch (error) {
    console.error("Daily digest failed:", error);
    return Response.json({ error: "Digest failed to send." }, { status: 500 });
  }
}
