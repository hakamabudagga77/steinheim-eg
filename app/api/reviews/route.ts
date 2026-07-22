import { randomUUID } from "node:crypto";
import { sanitizeReviewSubmission } from "@/lib/reviews";
import { listApprovedReviewsForProduct, saveReview } from "@/lib/server/review-store";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { getProductBySlug } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  if (!slug) return Response.json({ error: "A product slug is required." }, { status: 400 });

  try {
    const reviews = await listApprovedReviewsForProduct(slug);
    const count = reviews.length;
    const average = count ? reviews.reduce((sum, review) => sum + review.rating, 0) / count : 0;
    return Response.json(
      { reviews, average, count },
      { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } }
    );
  } catch (error) {
    const unavailable = error instanceof Error && error.message === "REVIEW_STORE_NOT_CONFIGURED";
    return Response.json({ error: unavailable ? "Review storage is not configured." : "Could not load reviews." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!(await checkRateLimit(request, "reviews", 5, 60 * 60))) {
    return Response.json({ error: "Too many submissions." }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as { website?: unknown } | null;
  if (body && (body as { website?: unknown }).website) return Response.json({ ok: true });

  const submission = sanitizeReviewSubmission(body);
  if (!submission) {
    return Response.json({ error: "A valid product, rating (1-5), name, and review text are required." }, { status: 400 });
  }
  if (!getProductBySlug(submission.productSlug)) {
    return Response.json({ error: "That product could not be found." }, { status: 400 });
  }

  const review = {
    id: randomUUID(),
    productSlug: submission.productSlug,
    rating: submission.rating,
    authorName: submission.authorName,
    body: submission.body,
    submittedAt: new Date().toISOString(),
    status: "pending" as const,
  };

  try {
    await saveReview(review);
  } catch (error) {
    const unavailable = error instanceof Error && error.message === "REVIEW_STORE_NOT_CONFIGURED";
    return Response.json(
      { error: unavailable ? "Review storage is not configured." : "The review could not be saved." },
      { status: 503 }
    );
  }

  return Response.json({ ok: true });
}
