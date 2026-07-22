import { isReviewStatus } from "@/lib/reviews";
import { listReviews, updateReview } from "@/lib/server/review-store";
import { isAdminRequest } from "@/lib/server/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return Response.json({ reviews: await listReviews() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const unavailable = error instanceof Error && error.message === "REVIEW_STORE_NOT_CONFIGURED";
    return Response.json({ error: unavailable ? "Review storage is not configured." : "Could not load reviews." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  if (!isAdminRequest(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { id?: unknown; status?: unknown } | null;
  if (!body || typeof body.id !== "string" || !isReviewStatus(body.status)) {
    return Response.json({ error: "A valid review id and status are required." }, { status: 400 });
  }
  const review = await updateReview(body.id, { status: body.status });
  if (!review) return Response.json({ error: "Review not found." }, { status: 404 });
  return Response.json({ review });
}
