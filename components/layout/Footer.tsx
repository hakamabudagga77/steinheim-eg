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
          {[
            { label: "Assistance", desc: "Do you need assistance or would you like to request information?", href: "/contact" },
            { label: "News & Events", desc: "News, insights and must-see moments.", href: "/about" },
            { label: "Catalogues", desc: "Flip through the catalogs to find the newest collections.", href: "/collections" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`group flex flex-col border-b py-8 transition sm:border-b-0 sm:border-r sm:px-6 sm:last:border-r-0 lg:px-10 lg:py-12 ${borderClass} ${itemHoverClass}`}
            >
              <p className={`text-[14px] font-medium transition ${primaryTextClass}`}>{item.label}</p>
              <p className={`mt-2 text-[12px] leading-[1.65] ${mutedTextClass}`}>{item.desc}</p>
              <span className={`mt-4 inline-flex text-[11px] font-medium uppercase tracking-[0.12em] transition ${linkClass}`}>
                Discover more →
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
            <p className={`text-[10px] uppercase tracking-[0.12em] ${dark ? "text-white/25" : "text-black/45"}`}>Egypt / EN</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-5">
            <Link href="/collections" className={`text-[10px] uppercase tracking-[0.08em] transition ${linkClass}`}>Collections</Link>
            <Link href="/about" className={`text-[10px] uppercase tracking-[0.08em] transition ${linkClass}`}>Our World</Link>
            <Link href="/contact" className={`text-[10px] uppercase tracking-[0.08em] transition ${linkClass}`}>Do You Need Help?</Link>
            <Link href="/contact" className={`text-[10px] uppercase tracking-[0.08em] transition ${linkClass}`}>Newsletter</Link>
          </div>
          <p className={`text-[10px] tracking-[0.08em] ${dark ? "text-white/15" : "text-black/35"}`}>
            &copy; {new Date().getFullYear()} Steinheim. {t("rights")}.
          </p>
        </div>
      </div>
    </footer>
  );
}
