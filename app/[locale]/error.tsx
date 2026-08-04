"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import * as Sentry from "@sentry/nextjs";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errorPage");

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <section className="flex min-h-[60vh] items-center justify-center px-6 py-24">
      <div className="max-w-xl text-center">
        <p className="text-[11px] uppercase tracking-[0.3em] text-black/50">Steinheim</p>
        <h1
          className="mt-6 font-heading text-[clamp(2.2rem,5vw,3.6rem)] font-light leading-[0.95] tracking-[-0.04em] text-black"
          style={{ fontStyle: "italic" }}
        >
          {t("title")}
        </h1>
        <p className="mx-auto mt-6 max-w-md text-[14px] leading-[1.75] text-black/55">{t("body")}</p>
        <button
          type="button"
          onClick={reset}
          className="mt-10 inline-flex h-[48px] items-center rounded-full border border-black/25 px-8 text-[12px] font-medium text-black transition hover:bg-black hover:text-white"
        >
          {t("reloadButton")}
        </button>
      </div>
    </section>
  );
}
