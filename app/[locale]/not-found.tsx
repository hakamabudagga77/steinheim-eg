"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("notFoundPage");

  return (
    <section className="flex min-h-[60vh] items-center justify-center px-6 py-24">
      <div className="max-w-xl text-center">
        <p className="text-[11px] uppercase tracking-[0.3em] text-black/50">404</p>
        <h1
          className="mt-6 font-heading text-[clamp(2.6rem,6vw,4.6rem)] font-light leading-[0.9] tracking-[-0.04em] text-black"
          style={{ fontStyle: "italic" }}
        >
          {t("title")}
        </h1>
        <p className="mx-auto mt-6 max-w-md text-[14px] leading-[1.75] text-black/55">{t("body")}</p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/"
            className="inline-flex h-[48px] items-center rounded-full border border-black/25 px-8 text-[12px] font-medium text-black transition hover:bg-black hover:text-white"
          >
            {t("homeButton")}
          </Link>
        </div>
        <p className="mt-5 text-[12px] text-black/40">{t("searchHint")}</p>
      </div>
    </section>
  );
}
