export type ReviewStatus = "pending" | "approved" | "rejected";

export const reviewStatuses: ReviewStatus[] = ["pending", "approved", "rejected"];

export function isReviewStatus(value: unknown): value is ReviewStatus {
  return typeof value === "string" && (reviewStatuses as string[]).includes(value);
}

export interface ProductReview {
  id: string;
  productSlug: string;
  rating: number;
  authorName: string;
  body: string;
  submittedAt: string;
  status: ReviewStatus;
}

export interface ReviewSubmission {
  productSlug: string;
  rating: number;
  authorName: string;
  body: string;
}

export function sanitizeReviewSubmission(value: unknown): ReviewSubmission | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Partial<Record<keyof ReviewSubmission, unknown>>;
  const productSlug = typeof source.productSlug === "string" ? source.productSlug.trim().slice(0, 120) : "";
  const authorName = typeof source.authorName === "string" ? source.authorName.trim().slice(0, 120) : "";
  const body = typeof source.body === "string" ? source.body.trim().slice(0, 2000) : "";
  const rating = Math.round(Number(source.rating));
  if (!productSlug || !authorName || !body || !Number.isFinite(rating) || rating < 1 || rating > 5) return null;
  return { productSlug, rating, authorName, body };
}
