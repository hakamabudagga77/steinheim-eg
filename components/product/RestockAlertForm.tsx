"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";

export default function RestockAlertForm({ productSlug, finish }: { productSlug: string; finish: string }) {
  const t = useTranslations("restockAlert");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/restock-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, productSlug, finish }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not save your request.");
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your request.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <p role="status" className="mt-3 text-[13px] text-black/60">
        {t("submittedMessage")}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex flex-wrap items-center gap-2">
      <label htmlFor="restock-email" className="sr-only">
        {t("emailPlaceholder")}
      </label>
      <input
        id="restock-email"
        name="email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t("emailPlaceholder")}
        aria-describedby={error ? "restock-error" : undefined}
        className="h-10 min-w-[220px] flex-1 rounded-full border border-black/15 bg-white px-4 text-[13px] text-black outline-none focus:border-black/40"
      />
      <button
        type="submit"
        disabled={submitting}
        className="flex h-10 shrink-0 items-center justify-center rounded-full border border-black/25 px-5 text-[12px] font-medium transition hover:bg-black hover:text-white disabled:opacity-40"
      >
        {submitting ? t("submitting") : t("notifyMe")}
      </button>
      {error && (
        <p id="restock-error" role="alert" className="w-full text-[12px] text-red-500">
          {error}
        </p>
      )}
    </form>
  );
}
