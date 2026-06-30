"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import Image from "next/image";
import { collectionBanners } from "@/data/images";
import Logo from "@/components/ui/Logo";
import { useCart } from "@/components/cart/CartContext";

const collections = [
  { id: "joy", href: "/collections/joy" },
  { id: "up", href: "/collections/up" },
  { id: "art", href: "/collections/art" },
  { id: "quatro", href: "/collections/quatro" },
];

const menuLinks = [
  { key: "projects", href: "/projects" },
  { key: "trade", href: "/trade" },
  { key: "assistant", href: "/assistant" },
  { key: "about", href: "/about" },
  { key: "contact", href: "/contact" },
];

export default function Navigation({ locale }: { locale: string }) {
  const t = useTranslations("nav");
  const tc = useTranslations("collections");
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoveredCollection, setHoveredCollection] = useState<string | null>(null);
  const { itemCount, setOpen: setCartOpen } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const handleNavigate = useCallback(() => {
    setMenuOpen(false);
    setHoveredCollection(null);
  }, []);

  const isHome = pathname === "/" || pathname === "/en" || pathname === "/ar";
  const isTransparent = isHome && !scrolled;

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isTransparent
            ? "bg-transparent"
            : "bg-white/95 backdrop-blur-sm shadow-[0_1px_0_rgba(0,0,0,0.06)]"
        }`}
      >
        <div className="relative mx-auto flex h-[72px] max-w-[1920px] items-center justify-between px-5 sm:px-8 lg:h-[80px] lg:px-16">
          <button
            onClick={() => setMenuOpen(true)}
            className={`flex items-center gap-5 text-[14px] font-medium uppercase transition-colors duration-300 cursor-pointer ${
              isTransparent
                ? "text-white hover:text-white/70"
                : "text-charcoal hover:text-charcoal/60"
            }`}
            aria-label={t("menu")}
          >
            <span className="flex h-9 w-12 flex-col justify-center gap-[7px]">
              <span className="block h-px w-11 bg-current" />
              <span className="block h-px w-11 bg-current" />
            </span>
            <span className="hidden sm:block">Menu</span>
          </button>
          {/* Logo */}
          <Link
            href="/"
            className="absolute left-1/2 top-1/2 shrink-0 -translate-x-1/2 -translate-y-1/2"
            aria-label="Steinheim home"
          >
            <Logo color={isTransparent ? "light" : "dark"} size="sm" showWave={false} />
          </Link>

          <div className="flex items-center gap-3 lg:gap-6">
            <Link
              href="/trade"
              className={`hidden text-[13px] font-medium uppercase transition-colors duration-300 lg:block ${
                isTransparent
                  ? "text-white/82 hover:text-white"
                  : "text-charcoal/70 hover:text-charcoal"
              }`}
            >
              Area Pro
            </Link>
            {/* Search */}
            <Link
              href="/collections"
              className={`hidden transition-colors duration-300 sm:flex ${
                isTransparent
                  ? "text-white/65 hover:text-white"
                  : "text-charcoal/50 hover:text-charcoal"
              }`}
              aria-label="Search collections"
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
            </Link>
            {/* Wishlist / Heart — Gessi style */}
            <button
              onClick={() => setCartOpen(true)}
              className={`hidden transition-colors duration-300 sm:flex cursor-pointer ${
                isTransparent
                  ? "text-white/65 hover:text-white"
                  : "text-charcoal/50 hover:text-charcoal"
              }`}
              aria-label="Wishlist"
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-charcoal px-0.5 text-[7px] font-medium text-white">
                  {itemCount}
                </span>
              )}
            </button>
            {/* Country / Globe — Gessi style */}
            <Link
              href={`/${locale === "en" ? "ar" : "en"}`}
              className={`hidden items-center gap-2 text-[11px] font-medium uppercase transition-colors duration-300 lg:flex ${
                isTransparent
                  ? "text-white/55 hover:text-white"
                  : "text-charcoal/45 hover:text-charcoal"
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
              </svg>
              <span>{locale === "en" ? "EN" : "AR"}</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Fullscreen overlay menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 0.76, 0.2, 1] }}
            className="fixed inset-0 z-[60] bg-black/35 text-charcoal backdrop-blur-md"
          >
            {/* Close bar — Gessi: X CLOSE left, logo center, language right */}
            <div className="mx-3 mt-3 flex h-[72px] max-w-[1120px] items-center justify-between rounded-t-[22px] bg-[#f5f3ee] px-7 shadow-[0_24px_80px_rgba(0,0,0,0.16)] lg:mx-6 lg:mt-6 lg:h-[78px] lg:px-10">
              <button
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 text-[14px] font-medium uppercase text-black/65 hover:text-black transition-colors duration-300 cursor-pointer"
                aria-label={t("close")}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.3">
                  <line x1="4" y1="4" x2="16" y2="16" />
                  <line x1="16" y1="4" x2="4" y2="16" />
                </svg>
                <span className="hidden sm:inline">Close</span>
              </button>

              <Link
                href="/"
                onClick={handleNavigate}
                className="absolute left-1/2 -translate-x-1/2 shrink-0"
                aria-label="Steinheim home"
              >
                <Logo color="dark" size="sm" showWave={false} />
              </Link>

              <Link
                href={pathname}
                locale={locale === "en" ? "ar" : "en"}
                onClick={handleNavigate}
                className="text-[11px] font-medium text-black/40 hover:text-black transition-colors duration-300"
              >
                {locale === "en" ? "Arabic" : "English"}
              </Link>
            </div>

            {/* Menu content */}
            <div className="mx-3 mb-3 flex h-[calc(100vh-90px)] max-w-[1120px] overflow-hidden rounded-b-[22px] bg-[#f5f3ee] shadow-[0_24px_80px_rgba(0,0,0,0.16)] lg:mx-6 lg:mb-6 lg:h-[calc(100vh-108px)]">
              {/* Left: Navigation links */}
              <div className="flex w-full flex-col justify-center border-r border-black/10 px-8 lg:w-[36%] lg:px-10">
                {/* Collections */}
                <div className="mb-12">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-black/35 mb-8">
                    {t("collections")}
                  </p>
                  <div className="space-y-1">
                    {collections.map((c, i) => (
                      <motion.div
                        key={c.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 + i * 0.06, duration: 0.5, ease: [0.22, 0.76, 0.2, 1] }}
                      >
                        <Link
                          href={c.href}
                          onClick={handleNavigate}
                          onMouseEnter={() => setHoveredCollection(c.id)}
                          onMouseLeave={() => setHoveredCollection(null)}
                          className={`block py-2 text-[clamp(1.5rem,2.3vw,2.8rem)] font-medium leading-[1.15] transition-all duration-400 ${
                            pathname.includes(c.id)
                              ? "text-black"
                              : "text-black/50 hover:text-black hover:translate-x-2"
                          }`}
                        >
                          {tc(`${c.id}.name`)}
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="w-16 h-px bg-black/12 origin-left mb-12"
                />

                {/* Other links */}
                <div className="space-y-1">
                  {menuLinks.map((link, i) => (
                    <motion.div
                      key={link.key}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.45 + i * 0.05, duration: 0.4, ease: [0.22, 0.76, 0.2, 1] }}
                    >
                      <Link
                        href={link.href}
                        onClick={handleNavigate}
                        className={`block py-2 text-[13px] font-medium uppercase tracking-[0.2em] transition-all duration-300 ${
                          pathname === link.href
                            ? "text-black"
                            : "text-black/42 hover:text-black hover:tracking-[0.25em]"
                        }`}
                      >
                        {t(link.key)}
                      </Link>
                    </motion.div>
                  ))}
                </div>

                {/* Footer info */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                  className="mt-16"
                >
                  <p className="text-[11px] text-black/30 tracking-[0.1em]">
                    inquiries@steinheim-eg.com
                  </p>
                </motion.div>
              </div>

              {/* Right: Gessi-style visual cards */}
              <div className="hidden flex-1 p-4 lg:block">
                <div className="grid h-full grid-cols-2 gap-4">
                  {collections.map((collection, index) => {
                    const image = collectionBanners[collection.id];
                    const isDimmed = hoveredCollection !== null && hoveredCollection !== collection.id;

                    return (
                      <motion.div
                        key={collection.id}
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: isDimmed ? 0.38 : 1, y: 0 }}
                        transition={{
                          opacity: { duration: 0.35 },
                          y: { delay: 0.2 + index * 0.04, duration: 0.5, ease: [0.22, 0.76, 0.2, 1] },
                        }}
                      >
                        <Link
                          href={collection.href}
                          onClick={handleNavigate}
                          onMouseEnter={() => setHoveredCollection(collection.id)}
                          onMouseLeave={() => setHoveredCollection(null)}
                          className="group relative block h-full min-h-[220px] overflow-hidden rounded-[18px] bg-[#ebe8e1]"
                        >
                          {image ? (
                            <Image
                              src={image}
                              alt={tc(`${collection.id}.name`)}
                              fill
                              sizes="32vw"
                              className="object-cover transition duration-[1200ms] group-hover:scale-[1.045]"
                              priority={index < 2}
                            />
                          ) : null}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent opacity-85 transition duration-500 group-hover:opacity-65" />
                          <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                            <p className="text-[10px] uppercase tracking-[0.34em] text-white/62">
                              Collection
                            </p>
                            <p className="mt-2 font-heading text-[30px] leading-none">
                              {tc(`${collection.id}.name`)}
                            </p>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
