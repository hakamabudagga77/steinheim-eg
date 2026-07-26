import { describe, expect, it } from "vitest";
import { sanitizeRestockAlertSubmission } from "@/lib/restock-alerts";

describe("sanitizeRestockAlertSubmission", () => {
  const valid = {
    email: "shopper@example.com",
    productSlug: "joy-basin-mixer",
    finish: "chrome",
  };

  it("returns null for non-object input", () => {
    expect(sanitizeRestockAlertSubmission(null)).toBeNull();
    expect(sanitizeRestockAlertSubmission(undefined)).toBeNull();
    expect(sanitizeRestockAlertSubmission("nope")).toBeNull();
    expect(sanitizeRestockAlertSubmission(7)).toBeNull();
  });

  it("accepts a well-formed submission and trims its fields", () => {
    expect(
      sanitizeRestockAlertSubmission({
        email: "  shopper@example.com  ",
        productSlug: "  joy-basin-mixer  ",
        finish: "  chrome  ",
      })
    ).toEqual(valid);
  });

  it("rejects malformed email addresses", () => {
    expect(sanitizeRestockAlertSubmission({ ...valid, email: "plainaddress" })).toBeNull();
    expect(sanitizeRestockAlertSubmission({ ...valid, email: "no-at.example.com" })).toBeNull();
    expect(sanitizeRestockAlertSubmission({ ...valid, email: "missing@domain" })).toBeNull();
    expect(sanitizeRestockAlertSubmission({ ...valid, email: "@example.com" })).toBeNull();
    expect(sanitizeRestockAlertSubmission({ ...valid, email: "spaces in@example.com" })).toBeNull();
    expect(sanitizeRestockAlertSubmission({ ...valid, email: "user@.com" })).toBeNull();
    expect(sanitizeRestockAlertSubmission({ ...valid, email: "" })).toBeNull();
  });

  it("requires product and finish", () => {
    expect(sanitizeRestockAlertSubmission({ ...valid, productSlug: "" })).toBeNull();
    expect(sanitizeRestockAlertSubmission({ ...valid, finish: "   " })).toBeNull();
    expect(sanitizeRestockAlertSubmission({ ...valid, productSlug: 123 })).toBeNull();
  });

  it("truncates over-long fields to their caps", () => {
    // The email is sliced to 200 before the regex runs, so the "@domain.tld"
    // part must fall within the first 200 chars for the value to survive.
    const result = sanitizeRestockAlertSubmission({
      email: `${"e".repeat(195)}@ex.co`,
      productSlug: "p".repeat(300),
      finish: "f".repeat(300),
    });
    expect(result?.email.length).toBe(200);
    expect(result?.productSlug.length).toBe(120);
    expect(result?.finish.length).toBe(60);
  });
});
