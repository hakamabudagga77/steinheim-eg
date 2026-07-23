"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export default function RestockAlertForm({ productSlug, finish }: { productSlug: string; finish: string }) {
  const t = useTranslations("restockAlert");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
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
    return <p className="mt-3 text-[13px] text-black/60">{t("submittedMessage")}</p>;
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t("emailPlaceholder")}
        className="h-10 min-w-[220px] flex-1 rounded-full border border-black/15 bg-white px-4 text-[13px] text-black outline-none focus:border-black/40"
      />
      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting || !email.trim()}
        className="flex h-10 shrink-0 items-center justify-center rounded-full border border-black/25 px-5 text-[12px] font-medium transition hover:bg-black hover:text-white disabled:opacity-40"
      >
        {submitting ? t("submitting") : t("notifyMe")}
      </button>
      {error && <p className="w-full text-[12px] text-red-500">{error}</p>}
    </div>
  );
}
