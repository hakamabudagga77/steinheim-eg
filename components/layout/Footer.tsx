"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Logo from "@/components/ui/Logo";

const footerLinks = [
  { key: "collections", href: "/collections/joy" },
  { key: "projects", href: "/projects" },
  { key: "trade", href: "/trade" },
  { key: "about", href: "/about" },
  { key: "contact", href: "/contact" },
];

export default function Footer() {
  const t = useTranslations("footer");
  const tn = useTranslations("nav");

  return (
    <footer className="bg-[#111111] text-white">
      {/* Statement band */}
      <div className="border-b border-white/6">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
          <div className="py-16 sm:py-20 lg:py-24">
            <p className="max-w-3xl font-heading text-[clamp(1.6rem,3.5vw,2.8rem)] leading-[1.15] text-white/80">
              Precision-engineered fixtures for spaces that demand permanence.
            </p>
          </div>
        </div>
      </div>

      {/* Main footer grid */}
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 gap-12 py-14 sm:grid-cols-2 sm:py-16 lg:grid-cols-[1.2fr_0.6fr_0.6fr_0.8fr] lg:gap-10 lg:py-20">
          {/* Brand */}
          <div>
            <Link href="/" className="inline-flex" aria-label="Steinheim home">
              <Logo color="light" size="md" />
            </Link>
            <p className="mt-5 max-w-[260px] text-[13px] leading-[1.75] text-white/30">
              {t("tagline")}
            </p>
            <p className="mt-2 text-[13px] text-white/20">
              {t("distributor")}
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-3">
            <p className="mb-1 text-[9px] font-medium uppercase tracking-[0.25em] text-white/20">
              Navigate
            </p>
            {footerLinks.map((link) => (
              <Link
                key={link.key}
                href={link.href}
                className="text-[13px] text-white/40 transition-colors duration-300 hover:text-white"
              >
                {tn(link.key)}
              </Link>
            ))}
          </nav>

          {/* Collections */}
          <div className="flex flex-col gap-3">
            <p className="mb-1 text-[9px] font-medium uppercase tracking-[0.25em] text-white/20">
              Collections
            </p>
            {["Joy", "Up", "Art", "Quatro"].map((name) => (
              <Link
                key={name}
                href={`/collections/${name.toLowerCase()}`}
                className="text-[13px] text-white/40 transition-colors duration-300 hover:text-white"
              >
                {name}
              </Link>
            ))}
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-3">
            <p className="mb-1 text-[9px] font-medium uppercase tracking-[0.25em] text-white/20">
              Contact
            </p>
            <a
              href="mailto:inquiries@steinheim-eg.com"
              className="text-[13px] text-white/40 transition-colors duration-300 hover:text-white"
            >
              inquiries@steinheim-eg.com
            </a>
            <a
              href="https://wa.me/201223998124"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[13px] text-white/40 transition-colors duration-300 hover:text-white"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 opacity-60">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 01-4.243-1.214l-.257-.154-2.871.853.853-2.871-.154-.257A8 8 0 1112 20z" />
              </svg>
              +20 122 399 8124
            </a>
            <p className="mt-1 text-[13px] text-white/25">Cairo, Egypt</p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-white/6 py-6 sm:flex-row">
          <p className="text-[10px] tracking-[0.05em] text-white/15">
            &copy; {new Date().getFullYear()} Steinheim. {t("rights")}.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/shipping" className="text-[10px] tracking-[0.05em] text-white/15 transition hover:text-white/40">Shipping</Link>
            <Link href="/returns" className="text-[10px] tracking-[0.05em] text-white/15 transition hover:text-white/40">Returns</Link>
            <Link href="/privacy" className="text-[10px] tracking-[0.05em] text-white/15 transition hover:text-white/40">Privacy</Link>
            <Link href="/warranty" className="text-[10px] tracking-[0.05em] text-white/15 transition hover:text-white/40">Warranty</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
