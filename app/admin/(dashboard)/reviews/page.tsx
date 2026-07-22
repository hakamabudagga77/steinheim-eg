"use client";

import { useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";
import type { ProductReview, ReviewStatus } from "@/lib/reviews";
import { getProductBySlug } from "@/lib/utils";
import { PageHeader, Panel, Badge, SegmentedControl, EmptyState, ErrorState, type BadgeTone } from "@/components/admin/ui";

const FILTER_OPTIONS: Array<{ value: ReviewStatus | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

function statusTone(status: ReviewStatus): BadgeTone {
  if (status === "approved") return "positive";
  if (status === "rejected") return "muted";
  return "warning";
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${i < rating ? "fill-amber-400 text-amber-400" : "text-white/15"}`} />
      ))}
    </div>
  );
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ProductReview[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ReviewStatus | "all">("pending");

  useEffect(() => {
    fetch("/api/admin/reviews")
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Could not load reviews.");
        }
        return res.json();
      })
      .then((data) => setReviews(data.reviews))
      .catch((err) => setError(err.message));
  }, []);

  async function updateStatus(id: string, status: ReviewStatus) {
    const res = await fetch("/api/admin/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (!res.ok) return;
    const data = await res.json();
    setReviews((prev) => prev?.map((review) => (review.id === id ? data.review : review)) ?? null);
  }

  const filteredReviews = useMemo(() => {
    if (!reviews) return [];
    if (filter === "all") return reviews;
    return reviews.filter((review) => review.status === filter);
  }, [reviews, filter]);

  const counts = useMemo(() => {
    const c = { pending: 0, approved: 0, rejected: 0 };
    reviews?.forEach((r) => c[r.status]++);
    return c;
  }, [reviews]);

  return (
    <div>
      <PageHeader
        eyebrow="Customer Reviews"
        title={reviews ? `${reviews.length} review${reviews.length === 1 ? "" : "s"}` : "Loading…"}
        subtitle="Moderate reviews submitted on product pages before they go public."
      />

      {error && <ErrorState>{error}</ErrorState>}

      {reviews && reviews.length > 0 && (
        <div className="mt-6">
          <SegmentedControl
            options={FILTER_OPTIONS.map((opt) => ({
              ...opt,
              label: opt.value === "all" ? `All · ${reviews.length}` : `${opt.label} · ${counts[opt.value]}`,
            }))}
            value={filter}
            onChange={setFilter}
          />
        </div>
      )}

      {reviews && reviews.length === 0 && <EmptyState>No reviews submitted yet.</EmptyState>}
      {reviews && reviews.length > 0 && filteredReviews.length === 0 && <EmptyState>No reviews in this filter.</EmptyState>}

      {filteredReviews.length > 0 && (
        <div className="mt-6 space-y-3">
          {filteredReviews.map((review) => {
            const product = getProductBySlug(review.productSlug);
            return (
              <Panel key={review.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Stars rating={review.rating} />
                      <Badge tone={statusTone(review.status)}>{review.status}</Badge>
                    </div>
                    <p className="mt-1.5 text-[13.5px] font-medium text-white/90">{review.authorName}</p>
                    <p className="text-[11px] text-white/40">
                      {product?.name ?? review.productSlug} · {fmtDate(review.submittedAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => updateStatus(review.id, "approved")}
                      disabled={review.status === "approved"}
                      className="rounded-full border border-emerald-400/30 px-3.5 py-1.5 text-[11px] text-emerald-400 transition hover:bg-emerald-400/10 disabled:opacity-30"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStatus(review.id, "rejected")}
                      disabled={review.status === "rejected"}
                      className="rounded-full border border-white/15 px-3.5 py-1.5 text-[11px] text-white/55 transition hover:border-white/30 disabled:opacity-30"
                    >
                      Reject
                    </button>
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-wrap border-t border-white/[0.06] pt-3 text-[13px] leading-[1.65] text-white/70">
                  {review.body}
                </p>
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}
