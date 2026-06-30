"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Logo from "@/components/ui/Logo";

export default function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="bg-[#0a0a0a] text-white">
      {/* Gessi-style info strip above footer */}
      <div className="mx-auto max-w-[1780px] px-5 sm:px-8 lg:px-16">
        <div className="grid border-b border-white/6 sm:grid-cols-3">
          {[
            { label: "Assistance", desc: "Do you need assistance or would you like to request information?" },
            { label: "News & Events", desc: "News, insights and must-see moments." },
            { label: "Catalogues", desc: "Flip through the catalogs to find the newest collections." },
          ].map((item) => (
            <div key={item.label} className="border-b border-white/6 py-8 sm:border-b-0 sm:border-r sm:px-6 sm:last:border-r-0 lg:px-10 lg:py-12">
              <p className="text-[14px] font-medium text-white/70">{item.label}</p>
              <p className="mt-2 text-[12px] leading-[1.65] text-white/25">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Links grid */}
      <div className="mx-auto max-w-[1780px] px-5 sm:px-8 lg:px-16">
        <div className="grid grid-cols-2 gap-10 py-16 sm:grid-cols-4 lg:py-20">
          <div>
            <Link href="/" className="inline-flex" aria-label="Steinheim home">
              <Logo color="light" size="sm" showWave={false} />
            </Link>
            <p className="mt-5 max-w-[220px] text-[13px] leading-[1.75] text-white/25">
              {t("tagline")}
            </p>
          </div>

          <nav className="flex flex-col gap-3">
            <p className="mb-2 text-[10px] uppercase tracking-[0.3em] text-white/20">Navigate</p>
            {[
              { label: "Collections", href: "/collections" },
              { label: "Projects", href: "/projects" },
              { label: "Trade", href: "/trade" },
              { label: "About", href: "/about" },
              { label: "Contact", href: "/contact" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[13px] text-white/35 transition hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-col gap-3">
            <p className="mb-2 text-[10px] uppercase tracking-[0.3em] text-white/20">Collections</p>
            {["Joy", "Up", "Art", "Quatro"].map((name) => (
              <Link
                key={name}
                href={`/collections/${name.toLowerCase()}`}
                className="text-[13px] text-white/35 transition hover:text-white"
              >
                {name}
              </Link>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <p className="mb-2 text-[10px] uppercase tracking-[0.3em] text-white/20">Contact</p>
            <a
              href="mailto:inquiries@steinheim-eg.com"
              className="text-[13px] text-white/35 transition hover:text-white"
            >
              inquiries@steinheim-eg.com
            </a>
            <a
              href="https://wa.me/201223998124"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] text-white/35 transition hover:text-white"
            >
              +20 122 399 8124
            </a>
            <p className="text-[13px] text-white/20">Cairo, Egypt</p>
          </div>
        </div>

        {/* Bottom — Gessi style with globe */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-white/6 py-6 sm:flex-row">
          <div className="flex items-center gap-3">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/20">
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
            </svg>
            <p className="text-[10px] uppercase tracking-[0.12em] text-white/20">Egypt / EN</p>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/collections" className="text-[10px] uppercase tracking-[0.08em] text-white/15 transition hover:text-white/35">Collections</Link>
            <Link href="/about" className="text-[10px] uppercase tracking-[0.08em] text-white/15 transition hover:text-white/35">Our World</Link>
            <Link href="/contact" className="text-[10px] uppercase tracking-[0.08em] text-white/15 transition hover:text-white/35">Do You Need Help?</Link>
          </div>
          <p className="text-[10px] tracking-[0.08em] text-white/15">
            &copy; {new Date().getFullYear()} Steinheim. {t("rights")}.
          </p>
        </div>
      </div>
    </footer>
  );
}
