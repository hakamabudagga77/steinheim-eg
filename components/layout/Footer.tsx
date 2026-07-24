"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Logo from "@/components/ui/Logo";

export default function Footer({ dark = true }: { dark?: boolean }) {
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");
  const tWarranty = useTranslations("warranty");
  const tShipping = useTranslations("shippingPage");
  const tReturns = useTranslations("returnsPage");
  const tPrivacy = useTranslations("privacyPage");

  const borderClass = dark ? "border-white/6" : "border-black/8";
  const headingClass = dark ? "text-white/55" : "text-black/55";
  const linkClass = dark ? "text-white/60 hover:text-white" : "text-black/60 hover:text-black";
  const mutedTextClass = dark ? "text-white/55" : "text-black/55";

  const columns: { heading: string; links: { label: string; href: string }[] }[] = [
    {
      heading: t("columns.shop"),
      links: [
        { label: tNav("collections"), href: "/collections" },
        { label: tNav("allProducts"), href: "/products" },
        { label: tNav("bestSellers"), href: "/best-sellers" },
        { label: tNav("wishlist"), href: "/wishlist" },
      ],
    },
    {
      heading: t("columns.company"),
      links: [
        { label: tNav("about"), href: "/about" },
        { label: tNav("projects"), href: "/projects" },
        { label: tNav("trade"), href: "/trade" },
      ],
    },
    {
      heading: t("columns.support"),
      links: [
        { label: tNav("contact"), href: "/contact" },
        { label: tWarranty("title"), href: "/warranty" },
        { label: tShipping("title"), href: "/shipping" },
        { label: tReturns("title"), href: "/returns" },
        { label: tPrivacy("title"), href: "/privacy" },
      ],
    },
  ];

  return (
    <footer className={dark ? "bg-[#0a0a0a] text-white" : "bg-[#ece9e2] text-black"}>
      <div className={`border-b ${borderClass}`}>
        <div className="mx-auto grid max-w-[1780px] gap-x-8 gap-y-12 px-5 py-16 sm:grid-cols-2 sm:px-8 sm:py-20 lg:grid-cols-[1.3fr_1fr_1fr_1fr] lg:px-16">
          <div>
            <Logo color={dark ? "light" : "dark"} size="sm" />
            <p className={`mt-5 max-w-xs text-[13px] leading-[1.7] ${mutedTextClass}`}>{t("tagline")}</p>
            <p className={`mt-3 text-[11px] uppercase tracking-[0.12em] ${mutedTextClass}`}>{t("distributor")}</p>
          </div>

          {columns.map((column) => (
            <div key={column.heading}>
              <p className={`text-[11px] font-medium uppercase tracking-[0.15em] ${headingClass}`}>{column.heading}</p>
              <ul className="mt-5 space-y-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={`text-[13px] transition ${linkClass}`}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
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
              className={dark ? "text-white/55" : "text-black/55"}
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
            </svg>
            <p className={`text-[10px] uppercase tracking-[0.12em] ${dark ? "text-white/55" : "text-black/55"}`}>{t("localeLabel")}</p>
          </div>
          <p className={`text-[10px] tracking-[0.08em] ${dark ? "text-white/55" : "text-black/55"}`}>
            &copy; {new Date().getFullYear()} Steinheim. {t("rights")}.
          </p>
        </div>
      </div>
    </footer>
  );
}
