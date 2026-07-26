import { describe, expect, it } from "vitest";
import { isReviewStatus, sanitizeReviewSubmission } from "@/lib/reviews";

describe("sanitizeReviewSubmission", () => {
  const valid = {
    productSlug: "joy-basin-mixer",
    rating: 5,
    authorName: "Karim",
    body: "Excellent finish and flawless flow control.",
  };

  it("returns null for non-object input", () => {
    expect(sanitizeReviewSubmission(null)).toBeNull();
    expect(sanitizeReviewSubmission(undefined)).toBeNull();
    expect(sanitizeReviewSubmission("not an object")).toBeNull();
    expect(sanitizeReviewSubmission(42)).toBeNull();
  });

  it("accepts a well-formed submission and trims its fields", () => {
    expect(
      sanitizeReviewSubmission({ ...valid, productSlug: "  joy-basin-mixer  ", authorName: "  Karim  " })
    ).toEqual(valid);
  });

  it("rejects ratings outside the 1-5 range", () => {
    expect(sanitizeReviewSubmission({ ...valid, rating: 0 })).toBeNull();
    expect(sanitizeReviewSubmission({ ...valid, rating: 6 })).toBeNull();
    expect(sanitizeReviewSubmission({ ...valid, rating: -3 })).toBeNull();
    expect(sanitizeReviewSubmission({ ...valid, rating: 1 })?.rating).toBe(1);
    expect(sanitizeReviewSubmission({ ...valid, rating: 5 })?.rating).toBe(5);
  });

  it("rounds fractional ratings before applying the bounds", () => {
    expect(sanitizeReviewSubmission({ ...valid, rating: 4.4 })?.rating).toBe(4);
    expect(sanitizeReviewSubmission({ ...valid, rating: 4.6 })?.rating).toBe(5);
    // 5.4 rounds down to a valid 5, 5.6 rounds up to an out-of-range 6.
    expect(sanitizeReviewSubmission({ ...valid, rating: 5.4 })?.rating).toBe(5);
    expect(sanitizeReviewSubmission({ ...valid, rating: 5.6 })).toBeNull();
  });

  it("rejects non-finite or non-numeric ratings", () => {
    expect(sanitizeReviewSubmission({ ...valid, rating: Number.NaN })).toBeNull();
    expect(sanitizeReviewSubmission({ ...valid, rating: Number.POSITIVE_INFINITY })).toBeNull();
    expect(sanitizeReviewSubmission({ ...valid, rating: "abc" })).toBeNull();
    expect(sanitizeReviewSubmission({ ...valid, rating: null })).toBeNull();
  });

  it("rejects empty or whitespace-only text fields", () => {
    expect(sanitizeReviewSubmission({ ...valid, productSlug: "   " })).toBeNull();
    expect(sanitizeReviewSubmission({ ...valid, authorName: "" })).toBeNull();
    expect(sanitizeReviewSubmission({ ...valid, body: "   " })).toBeNull();
    expect(sanitizeReviewSubmission({ ...valid, productSlug: 123 })).toBeNull();
  });

  it("truncates over-long fields to their caps", () => {
    const result = sanitizeReviewSubmission({
      ...valid,
      productSlug: "s".repeat(300),
      authorName: "a".repeat(300),
      body: "b".repeat(3000),
    });
    expect(result?.productSlug.length).toBe(120);
    expect(result?.authorName.length).toBe(120);
    expect(result?.body.length).toBe(2000);
  });
});

describe("isReviewStatus", () => {
  it("accepts the three known statuses", () => {
    expect(isReviewStatus("pending")).toBe(true);
    expect(isReviewStatus("approved")).toBe(true);
    expect(isReviewStatus("rejected")).toBe(true);
  });

  it("rejects anything else, including wrong casing and non-strings", () => {
    expect(isReviewStatus("PENDING")).toBe(false);
    expect(isReviewStatus("")).toBe(false);
    expect(isReviewStatus("draft")).toBe(false);
    expect(isReviewStatus(42)).toBe(false);
    expect(isReviewStatus(null)).toBe(false);
    expect(isReviewStatus(undefined)).toBe(false);
  });
});
