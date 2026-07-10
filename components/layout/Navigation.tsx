"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import Image from "next/image";
import { getProductDefaultImage } from "@/data/images";
import Logo from "@/components/ui/Logo";
import { useCart } from "@/components/cart/CartContext";
import { getProductsBySeries } from "@/lib/utils";

const collections = [
  { id: "joy", href: "/collections/joy" },
  { id: "up", href: "/collections/up" },
  { id: "art", href: "/collections/art" },
  { id: "quatro", href: "/collections/quatro" },
];

const menuLinks = [
  { key: "projects", href: "/projects" },
  { key: "assistant", href: "/assistant" },
  { key: "contact", href: "/contact" },
];

const worldLinks = [
  {
    label: "The Company",
    eyebrow: "Identity",
    href: "/about",
    image: "/images/generated/gessi/steinheim-specification-story.png",
  },
  {
    label: "Our Finishes",
    eyebrow: "Surface language",
    href: "/about#finishes",
    image: "/images/generated/gessi/steinheim-finish-stack.png",
  },
  {
    label: "Trade Studio",
    eyebrow: "Projects",
    href: "/trade",
    image: "/images/generated/gessi/steinheim-wellness-architecture.png",
  },
];

const menuProductImages: Record<string, string> = {
  "joy-basin-mixer": "/images/nav-menu/products/joy-basin-mixer.png",
  "joy-tall-basin-mixer": "/images/nav-menu/products/joy-tall-basin-mixer.png",
  "joy-wall-mounted-basin-mixer": "/images/nav-menu/products/joy-wall-mounted-basin-mixer.png",
  "joy-concealed-shower": "/images/nav-menu/products/joy-concealed-shower.png",
  "up-basin-mixer": "/images/nav-menu/products/up-basin-mixer.png",
  "up-tall-basin-mixer": "/images/nav-menu/products/up-tall-basin-mixer.png",
  "up-wall-mounted-basin-mixer": "/images/nav-menu/products/up-wall-mounted-basin-mixer.png",
  "up-concealed-shower": "/images/nav-menu/products/up-concealed-shower.png",
  "art-basin-mixer": "/images/nav-menu/products/art-basin-mixer.png",
  "art-tall-basin-mixer": "/images/nav-menu/products/art-tall-basin-mixer.png",
  "art-wall-mounted-basin-mixer": "/images/nav-menu/products/art-wall-mounted-basin-mixer.png",
  "art-concealed-shower": "/images/nav-menu/products/art-concealed-shower.png",
  "quatro-basin-mixer": "/images/nav-menu/products/quatro-basin-mixer.png",
  "quatro-tall-basin-mixer": "/images/nav-menu/products/quatro-tall-basin-mixer.png",
  "quatro-wall-mounted-basin-mixer": "/images/nav-menu/products/quatro-wall-mounted-basin-mixer.png",
  "quatro-concealed-shower": "/images/nav-menu/products/quatro-concealed-shower.png",
};

export default function Navigation({ locale }: { locale: string }) {
  const t = useTranslations("nav");
  const tc = useTranslations("collections");
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<"collections" | "world">("collections");
  const [hoveredCollection, setHoveredCollection] = useState<string | null>(null);
  const { itemCount, setOpen: setCartOpen } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
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
    setActivePanel("collections");
  }, []);

  const isHome = pathname === "/" || pathname === "/en" || pathname === "/ar";
  const isCollectionPage = pathname === "/collections" || pathname.startsWith("/collections/");
  const isTransparent = (isHome || isCollectionPage) && !scrolled;
  const activeCollection = hoveredCollection ?? "joy";
  const activeProducts = getProductsBySeries(activeCollection).slice(0, 4);

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

          <Link
            href="/"
            className="absolute left-1/2 top-1/2 shrink-0 -translate-x-1/2 -translate-y-1/2"
            aria-label="Steinheim home"
          >
            <Logo color={isTransparent ? "light" : "dark"} size="sm" showWave={false} />
          </Link>

          <div className="flex items-center gap-3 lg:gap-5">
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
            <Link
              href="/contact"
              className={`hidden transition-colors duration-300 sm:flex ${
                isTransparent
                  ? "text-white/65 hover:text-white"
                  : "text-charcoal/50 hover:text-charcoal"
              }`}
              aria-label="Account"
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="8" r="4" />
                <path d="M5.5 21a6.5 6.5 0 0113 0" />
              </svg>
            </Link>
            <button
              onClick={() => setCartOpen(true)}
              className={`relative hidden transition-colors duration-300 sm:flex cursor-pointer ${
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
                <span className="absolute -top-1 -right-1.5 flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-charcoal px-0.5 text-[7px] font-medium text-white">
                  {itemCount}
                </span>
              )}
            </button>
            <Link
              href={`/${locale === "en" ? "ar" : "en"}`}
              className={`hidden items-center gap-2 text-[11px] font-medium uppercase transition-colors duration-300 lg:flex ${
                isTransparent
                  ? "text-white/55 hover:text-white"
                  : "text-charcoal/45 hover:text-charcoal"
              }`}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
              </svg>
              <span>Egypt / {locale === "en" ? "EN" : "AR"}</span>
            </Link>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 0.76, 0.2, 1] }}
            className="fixed inset-0 z-[60] bg-black/35 text-charcoal backdrop-blur-md"
          >
            <div className="mx-0 mt-0 flex h-[66px] max-w-[1120px] items-center justify-between bg-[#f5f3ee] px-5 shadow-[0_24px_80px_rgba(0,0,0,0.16)] sm:mx-3 sm:mt-3 sm:h-[72px] sm:rounded-t-[22px] sm:px-7 lg:mx-6 lg:mt-6 lg:h-[78px] lg:px-10">
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

            <div className="mx-0 mb-0 flex h-[calc(100svh-66px)] max-w-[1120px] overflow-hidden bg-[#f5f3ee] shadow-[0_24px_80px_rgba(0,0,0,0.16)] sm:mx-3 sm:mb-3 sm:h-[calc(100svh-87px)] sm:rounded-b-[22px] lg:mx-6 lg:mb-6 lg:h-[calc(100vh-108px)]">
              <div className="flex w-full flex-col overflow-y-auto border-r border-black/10 px-6 py-8 lg:w-[36%] lg:justify-center lg:overflow-visible lg:px-10 lg:py-0">
                <div className="mb-8 lg:mb-12">
                  <p className="mb-5 text-[10px] font-semibold uppercase tracking-[0.3em] text-black/35 lg:mb-8">
                    {t("collections")}
                  </p>
                  <div className="space-y-1">
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 0.76, 0.2, 1] }}
                    >
                      <Link
                        href="/collections"
                        onClick={handleNavigate}
                        onMouseEnter={() => setActivePanel("collections")}
                        className={`block py-2 text-[clamp(2.1rem,10vw,2.8rem)] font-normal leading-[1.05] transition-all duration-400 lg:text-[clamp(1.5rem,2.3vw,2.8rem)] lg:leading-[1.15] ${
                          pathname === "/collections" ? "text-black" : "text-black/35 hover:translate-x-2 hover:text-black"
                        }`}
                      >
                        Collections
                      </Link>
                    </motion.div>
                    {collections.map((collection, index) => (
                      <motion.div
                        key={collection.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 + index * 0.06, duration: 0.5, ease: [0.22, 0.76, 0.2, 1] }}
                      >
                        <Link
                          href={collection.href}
                          onClick={handleNavigate}
                          onMouseEnter={() => {
                            setActivePanel("collections");
                            setHoveredCollection(collection.id);
                          }}
                          className={`block py-2 text-[clamp(2.1rem,10vw,2.8rem)] font-medium leading-[1.05] transition-all duration-400 lg:text-[clamp(1.5rem,2.3vw,2.8rem)] lg:leading-[1.15] ${
                            (activePanel === "collections" && activeCollection === collection.id) || pathname.includes(collection.id)
                              ? "text-black"
                              : "text-black/50 hover:translate-x-2 hover:text-black"
                          }`}
                        >
                          {tc(`${collection.id}.name`)}
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {activePanel === "collections" && (
                  <motion.div
                    key={activeCollection}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="mb-8 grid grid-cols-2 gap-3 lg:hidden"
                  >
                    {activeProducts.map((product) => {
                      const image = menuProductImages[product.slug] ?? getProductDefaultImage(product.slug);
                      return (
                        <Link
                          key={product.slug}
                          href={`/products/${product.slug}`}
                          onClick={handleNavigate}
                          className="group overflow-hidden rounded-[16px] bg-black text-white"
                        >
                          <div className="relative aspect-[1.05]">
                            {image ? (
                              <Image
                                src={image}
                                alt={product.name}
                                fill
                                sizes="45vw"
                                className="object-cover transition duration-700 group-active:scale-[1.03]"
                              />
                            ) : null}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-transparent to-transparent" />
                            <p className="absolute inset-x-0 bottom-0 p-3 font-heading text-[18px] leading-none">
                              {product.name}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </motion.div>
                )}

                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="mb-6 h-px w-16 origin-left bg-black/12 lg:mb-8"
                />

                <div className="mb-8 lg:mb-10">
                  <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-black/35">
                    Our World
                  </p>
                  <div className="space-y-1">
                    {worldLinks.map((link, index) => (
                      <motion.div
                        key={link.label}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.42 + index * 0.05, duration: 0.4, ease: [0.22, 0.76, 0.2, 1] }}
                      >
                        <Link
                          href={link.href}
                          onClick={handleNavigate}
                          onMouseEnter={() => setActivePanel("world")}
                          className={`block py-1.5 text-[18px] leading-tight transition-all duration-300 ${
                            activePanel === "world"
                              ? "text-black"
                              : "text-black/50 hover:translate-x-2 hover:text-black"
                          }`}
                        >
                          {link.label}
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  {menuLinks.map((link, index) => (
                    <motion.div
                      key={link.key}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.45 + index * 0.05, duration: 0.4, ease: [0.22, 0.76, 0.2, 1] }}
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

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                  className="mt-8 lg:mt-16"
                >
                  <p className="text-[11px] tracking-[0.1em] text-black/30">
                    inquiries@steinheim-eg.com
                  </p>
                </motion.div>
              </div>

              <div className="hidden flex-1 p-4 lg:block">
                <div className="flex h-full flex-col rounded-[18px] bg-[#ebe8e1] p-4">
                  <AnimatePresence mode="wait">
                    {activePanel === "world" ? (
                      <motion.div
                        key="world"
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.42, ease: [0.22, 0.76, 0.2, 1] }}
                        className="flex h-full flex-col"
                      >
                        <div className="mb-4 flex items-end justify-between px-1">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-black/35">
                              Our World
                            </p>
                            <p className="mt-1 font-heading text-[28px] leading-none">
                              Steinheim Egypt
                            </p>
                          </div>
                          <Link
                            href="/about"
                            onClick={handleNavigate}
                            className="border-b border-black/20 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-black/42 transition hover:border-black hover:text-black"
                          >
                            Open story
                          </Link>
                        </div>

                        <div className="grid flex-1 grid-cols-2 gap-4">
                          {worldLinks.map((item, index) => (
                            <motion.div
                              key={item.label}
                              initial={{ opacity: 0, y: 14 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.045, duration: 0.38, ease: [0.22, 0.76, 0.2, 1] }}
                            >
                              <Link
                                href={item.href}
                                onClick={handleNavigate}
                                className="group relative block h-full min-h-[220px] overflow-hidden rounded-[18px] bg-black"
                              >
                                <Image
                                  src={item.image}
                                  alt={item.label}
                                  fill
                                  sizes="32vw"
                                  className="object-cover transition duration-[1200ms] group-hover:scale-[1.045]"
                                  priority={index < 2}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/62 via-black/10 to-transparent transition duration-500 group-hover:from-black/48" />
                                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                                  <p className="text-[10px] uppercase tracking-[0.28em] text-white/62">
                                    {item.eyebrow}
                                  </p>
                                  <p className="mt-2 text-[24px] leading-none tracking-[-0.04em]">
                                    {item.label}
                                  </p>
                                </div>
                              </Link>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key={activeCollection}
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.42, ease: [0.22, 0.76, 0.2, 1] }}
                        className="flex h-full flex-col"
                      >
                        <div className="mb-4 flex items-end justify-between px-1">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-black/35">
                              Products
                            </p>
                            <p className="mt-1 font-heading text-[28px] leading-none">
                              {tc(`${activeCollection}.name`)}
                            </p>
                          </div>
                          <Link
                            href={`/collections/${activeCollection}`}
                            onClick={handleNavigate}
                            className="border-b border-black/20 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-black/42 transition hover:border-black hover:text-black"
                          >
                            View collection
                          </Link>
                        </div>

                        <div className="grid flex-1 grid-cols-2 gap-4">
                          {activeProducts.map((product, index) => {
                            const image = menuProductImages[product.slug] ?? getProductDefaultImage(product.slug);
                            const model = product.variants[0]?.model ?? product.name;

                            return (
                              <motion.div
                                key={product.slug}
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.045, duration: 0.38, ease: [0.22, 0.76, 0.2, 1] }}
                              >
                                <Link
                                  href={`/products/${product.slug}`}
                                  onClick={handleNavigate}
                                  className="group relative block h-full min-h-[220px] overflow-hidden rounded-[18px] bg-black shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]"
                                >
                                  {image ? (
                                    <Image
                                      src={image}
                                      alt={product.name}
                                      fill
                                      sizes="32vw"
                                      className="object-cover transition duration-[1200ms] group-hover:scale-[1.055]"
                                      priority={index < 2}
                                    />
                                  ) : null}
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/8 to-transparent transition duration-500 group-hover:from-black/66" />
                                  <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                                    <p className="text-[10px] uppercase tracking-[0.28em] text-white/52">
                                      {model}
                                    </p>
                                    <p className="mt-2 font-heading text-[24px] leading-none tracking-[-0.04em] text-white">
                                      {product.name}
                                    </p>
                                    <span className="mt-4 inline-block border-b border-white/60 pb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70 opacity-0 transition duration-500 group-hover:opacity-100">
                                      Open product
                                    </span>
                                  </div>
                                </Link>
                              </motion.div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
