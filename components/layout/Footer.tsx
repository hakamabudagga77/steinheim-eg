"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function Footer({ dark = true }: { dark?: boolean }) {
  const t = useTranslations("footer");

  const borderClass = dark ? "border-white/6" : "border-black/8";
  const itemHoverClass = dark ? "hover:bg-white/[0.02]" : "hover:bg-black/[0.025]";
  const primaryTextClass = dark ? "text-white/70 group-hover:text-white" : "text-black/70 group-hover:text-black";
  const mutedTextClass = dark ? "text-white/25" : "text-black/45";
  const linkClass = dark ? "text-white/20 hover:text-white/45" : "text-black/40 hover:text-black/70";

  return (
    <footer className={dark ? "bg-[#0a0a0a] text-white" : "bg-[#ece9e2] text-black"}>
      <div className="mx-auto max-w-[1780px] px-5 sm:px-8 lg:px-16">
        <div className={`grid border-b sm:grid-cols-3 ${borderClass}`}>
          {([
            { key: "assistance", href: "/contact" },
            { key: "news", href: "/about" },
            { key: "catalogues", href: "/collections" },
          ] as const).map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`group flex flex-col border-b py-8 transition sm:border-b-0 sm:border-r sm:px-6 sm:last:border-r-0 lg:px-10 lg:py-12 ${borderClass} ${itemHoverClass}`}
            >
              <p className={`text-[14px] font-medium transition ${primaryTextClass}`}>{t(`${item.key}.label`)}</p>
              <p className={`mt-2 text-[12px] leading-[1.65] ${mutedTextClass}`}>{t(`${item.key}.desc`)}</p>
              <span className={`mt-4 inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.12em] transition ${linkClass}`}>
                {t("discoverMore")} <span className="inline-block rtl:rotate-180">→</span>
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-[1780px] px-5 sm:px-8 lg:px-16">
        <div className="flex flex-col items-center justify-between gap-4 py-7 sm:flex-row">
          <div className="flex items-center gap-3">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className={dark ? "text-white/20" : "text-black/35"}
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
            </svg>
            <p className={`text-[10px] uppercase tracking-[0.12em] ${dark ? "text-white/25" : "text-black/45"}`}>{t("localeLabel")}</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-5">
            <Link href="/collections" className={`text-[10px] uppercase tracking-[0.08em] transition ${linkClass}`}>{t("links.collections")}</Link>
            <Link href="/about" className={`text-[10px] uppercase tracking-[0.08em] transition ${linkClass}`}>{t("links.ourWorld")}</Link>
            <Link href="/contact" className={`text-[10px] uppercase tracking-[0.08em] transition ${linkClass}`}>{t("links.help")}</Link>
            <Link href="/contact" className={`text-[10px] uppercase tracking-[0.08em] transition ${linkClass}`}>{t("links.newsletter")}</Link>
          </div>
          <p className={`text-[10px] tracking-[0.08em] ${dark ? "text-white/15" : "text-black/35"}`}>
            &copy; {new Date().getFullYear()} Steinheim. {t("rights")}.
          </p>
        </div>
      </div>
    </footer>
  );
}
