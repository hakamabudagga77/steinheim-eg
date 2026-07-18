import { buildAndSendDailyDigest } from "@/lib/server/digest-email";
import { isAdminRequest } from "@/lib/server/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

function isAuthorized(request: Request): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (secret && authHeader === `Bearer ${secret}`) return true;
  return isAdminRequest(request);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const result = await buildAndSendDailyDigest();
    return Response.json(result);
  } catch (error) {
    console.error("Daily digest failed:", error);
    return Response.json({ error: "Digest failed to send." }, { status: 500 });
  }
}
