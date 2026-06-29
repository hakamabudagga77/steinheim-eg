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

const navLinks = [
  { label: "Collections", href: "/collections" },
  { label: "Projects", href: "/projects" },
  { label: "Trade", href: "/trade" },
  { label: "Concierge", href: "/assistant" },
  { label: "About", href: "/about" },
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

  const isHome = pathname === "/";
  const isTransparent = isHome && !scrolled;

  const activeImage = hoveredCollection && collectionBanners[hoveredCollection]
    ? collectionBanners[hoveredCollection]
    : null;

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isTransparent
            ? "bg-transparent"
            : "bg-white/95 backdrop-blur-sm shadow-[0_1px_0_rgba(0,0,0,0.06)]"
        }`}
      >
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center px-5 sm:px-8 lg:h-[80px] lg:px-12">
          {/* Logo — left */}
          <Link
            href="/"
            className="shrink-0"
            aria-label="Steinheim home"
          >
            <Logo color={isTransparent ? "light" : "dark"} size="sm" />
          </Link>

          {/* Desktop inline links — center */}
          <div className="ml-auto hidden items-center gap-7 lg:flex">
            {navLinks.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className={`text-[11px] font-medium transition-colors duration-300 ${
                  isTransparent
                    ? "text-white/55 hover:text-white"
                    : "text-charcoal/45 hover:text-charcoal"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Utility icons — far right */}
          <div className="ml-auto flex items-center gap-3 lg:ml-8">
            {/* Cart */}
            <button
              onClick={() => setCartOpen(true)}
              className={`relative flex h-9 w-9 items-center justify-center transition-colors duration-300 cursor-pointer ${
                isTransparent
                  ? "text-white/45 hover:text-white"
                  : "text-charcoal/35 hover:text-charcoal"
              }`}
              aria-label="Cart"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-charcoal px-1 text-[8px] font-medium text-white">
                  {itemCount}
                </span>
              )}
            </button>

            {/* Hamburger menu */}
            <button
              onClick={() => setMenuOpen(true)}
              className={`flex h-9 w-9 items-center justify-center transition-colors duration-300 cursor-pointer ${
                isTransparent
                  ? "text-white/55 hover:text-white"
                  : "text-charcoal/45 hover:text-charcoal"
              }`}
              aria-label={t("menu")}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2">
                <line x1="2" y1="6" x2="18" y2="6" />
                <line x1="2" y1="10" x2="18" y2="10" />
                <line x1="2" y1="14" x2="14" y2="14" />
              </svg>
            </button>
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
            className="fixed inset-0 z-[60] bg-charcoal"
          >
            {/* Close bar */}
            <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-8 lg:h-[80px] lg:px-12">
              <Link
                href="/"
                onClick={handleNavigate}
                className="shrink-0"
                aria-label="Steinheim home"
              >
                <Logo color="light" size="sm" />
              </Link>

              <div className="flex items-center gap-6">
                <Link
                  href={pathname}
                  locale={locale === "en" ? "ar" : "en"}
                  onClick={handleNavigate}
                  className="text-[11px] font-medium text-white/40 hover:text-white transition-colors duration-300"
                >
                  {locale === "en" ? "العربية" : "English"}
                </Link>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 text-white/50 hover:text-white transition-colors duration-300 cursor-pointer"
                  aria-label={t("close")}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2">
                    <line x1="4" y1="4" x2="16" y2="16" />
                    <line x1="16" y1="4" x2="4" y2="16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Menu content */}
            <div className="flex h-[calc(100vh-72px)] lg:h-[calc(100vh-80px)]">
              {/* Left: Navigation links */}
              <div className="flex-1 flex flex-col justify-center px-8 lg:px-20 xl:px-32">
                {/* Collections */}
                <div className="mb-12">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/25 mb-8">
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
                          className={`block py-2 font-heading text-[clamp(2rem,4vw,3.8rem)] uppercase tracking-[0.04em] leading-[1.15] transition-all duration-400 ${
                            pathname.includes(c.id)
                              ? "text-white"
                              : "text-white/30 hover:text-white hover:translate-x-2"
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
                  className="w-16 h-px bg-white/12 origin-left mb-12"
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
                            ? "text-white"
                            : "text-white/25 hover:text-white hover:tracking-[0.25em]"
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
                  <p className="text-[11px] text-white/20 tracking-[0.1em]">
                    inquiries@steinheim-eg.com
                  </p>
                </motion.div>
              </div>

              {/* Right: Hover image (desktop only) */}
              <div className="hidden lg:block w-[42%] xl:w-[38%] relative overflow-hidden">
                <AnimatePresence mode="wait">
                  {activeImage ? (
                    <motion.div
                      key={hoveredCollection}
                      initial={{ opacity: 0, scale: 1.05 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.6, ease: [0.22, 0.76, 0.2, 1] }}
                      className="absolute inset-0"
                    >
                      <Image
                        src={activeImage}
                        alt={hoveredCollection ? tc(`${hoveredCollection}.name`) : ""}
                        fill
                        sizes="42vw"
                        className="object-cover"
                        priority
                      />
                      <div className="absolute inset-0 bg-black/20" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-[#111]"
                    />
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
