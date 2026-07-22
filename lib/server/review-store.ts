import "server-only";

import type { ProductReview } from "@/lib/reviews";
import { createRedisJsonStore } from "@/lib/server/redis-json-store";

const store = createRedisJsonStore<ProductReview>({
  redisKey: "steinheim:reviews",
  localFileName: "reviews.json",
  maxEntries: 2000,
  notConfiguredError: "REVIEW_STORE_NOT_CONFIGURED",
});

export async function listReviews(): Promise<ProductReview[]> {
  const reviews = await store.list();
  return reviews.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export async function listApprovedReviewsForProduct(productSlug: string): Promise<ProductReview[]> {
  const reviews = await listReviews();
  return reviews.filter((review) => review.productSlug === productSlug && review.status === "approved");
}

export async function saveReview(review: ProductReview) {
  await store.save(review);
}

export async function updateReview(id: string, update: Partial<ProductReview>) {
  const reviews = await listReviews();
  const existing = reviews.find((entry) => entry.id === id);
  if (!existing) return null;
  const review: ProductReview = { ...existing, ...update, id: existing.id };
  await saveReview(review);
  return review;
}
