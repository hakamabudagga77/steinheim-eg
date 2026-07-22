"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { ProductReview } from "@/lib/reviews";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i < rating ? "#c9a961" : "none"} stroke="#c9a961" strokeWidth="1.4">
          <path d="M12 2.5l2.9 6.03 6.6.72-4.83 4.6 1.24 6.6L12 17.02l-5.9 3.43 1.24-6.6-4.83-4.6 6.6-.72z" />
        </svg>
      ))}
    </div>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const t = useTranslations("reviews");
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, i) => {
        const n = i + 1;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-label={t("starLabel", { n })}
            aria-pressed={value === n}
            className="p-0.5"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill={n <= value ? "#c9a961" : "none"} stroke="#c9a961" strokeWidth="1.3">
              <path d="M12 2.5l2.9 6.03 6.6.72-4.83 4.6 1.24 6.6L12 17.02l-5.9 3.43 1.24-6.6-4.83-4.6 6.6-.72z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}

export default function ProductReviews({ productSlug }: { productSlug: string }) {
  const t = useTranslations("reviews");
  const [reviews, setReviews] = useState<ProductReview[] | null>(null);
  const [average, setAverage] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [authorName, setAuthorName] = useState("");
  const [rating, setRating] = useState(0);
  const [bodyText, setBodyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/reviews?slug=${encodeURIComponent(productSlug)}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        setReviews(data.reviews);
        setAverage(data.average);
      })
      .catch((err) => {
        if (err.name !== "AbortError") console.error("Failed to load reviews:", err);
      });
    return () => controller.abort();
  }, [productSlug]);

  async function handleSubmit() {
    if (!authorName.trim() || !rating || !bodyText.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productSlug, rating, authorName, body: bodyText }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not submit your review.");
      }
      setSubmitted(true);
      setFormOpen(false);
      setAuthorName("");
      setRating(0);
      setBodyText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit your review.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="border-t border-black/8 pt-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-black/40">{t("title")}</p>
          {reviews && reviews.length > 0 ? (
            <div className="mt-2 flex items-center gap-2">
              <StarRow rating={Math.round(average)} size={16} />
              <p className="text-[13px] text-black/60">
                {t("averageSummary", { average: average.toFixed(1), count: reviews.length })}
              </p>
            </div>
          ) : (
            <p className="mt-2 text-[13px] text-black/45">{t("empty")}</p>
          )}
        </div>
        {!formOpen && !submitted && (
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="flex h-10 items-center justify-center rounded-full border border-black/20 px-5 text-[13px] text-black/70 transition hover:border-black hover:text-black"
          >
            {t("writeReview")}
          </button>
        )}
      </div>

      {submitted && <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-[13px] text-emerald-700">{t("submittedMessage")}</p>}

      {formOpen && (
        <div className="mt-5 max-w-lg rounded-xl border border-black/8 bg-white/40 p-5">
          <div className="mb-3">
            <p className="mb-1.5 text-[11px] uppercase tracking-[0.15em] text-black/40">{t("ratingLabel")}</p>
            <StarPicker value={rating} onChange={setRating} />
          </div>
          <div className="mb-3">
            <label className="mb-1.5 block text-[11px] uppercase tracking-[0.15em] text-black/40" htmlFor="review-author">
              {t("nameLabel")}
            </label>
            <input
              id="review-author"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="h-10 w-full rounded-lg border border-black/15 bg-white px-3 text-[13px] text-black outline-none focus:border-black/40"
            />
          </div>
          <div className="mb-4">
            <label className="mb-1.5 block text-[11px] uppercase tracking-[0.15em] text-black/40" htmlFor="review-body">
              {t("bodyLabel")}
            </label>
            <textarea
              id="review-body"
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-black/15 bg-white p-3 text-[13px] text-black outline-none focus:border-black/40"
            />
          </div>
          {error && <p className="mb-3 text-[12px] text-red-500">{error}</p>}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !authorName.trim() || !rating || !bodyText.trim()}
              className="flex h-10 items-center justify-center rounded-full bg-black px-6 text-[13px] font-medium text-white transition hover:bg-black/85 disabled:opacity-40"
            >
              {submitting ? t("submitting") : t("submit")}
            </button>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="flex h-10 items-center justify-center rounded-full border border-black/15 px-5 text-[13px] text-black/60 transition hover:border-black/35"
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      )}

      {reviews && reviews.length > 0 && (
        <div className="mt-6 space-y-5">
          {reviews.map((review) => (
            <div key={review.id} className="border-t border-black/6 pt-5 first:border-t-0 first:pt-0">
              <div className="flex items-center justify-between gap-3">
                <StarRow rating={review.rating} />
                <p className="text-[11px] text-black/35">{fmtDate(review.submittedAt)}</p>
              </div>
              <p className="mt-2 text-[13px] font-medium text-black/85">{review.authorName}</p>
              <p className="mt-1 whitespace-pre-wrap text-[13px] leading-[1.65] text-black/65">{review.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
