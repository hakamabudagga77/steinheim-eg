"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import Image from "next/image";
import { getProductDefaultImage } from "@/data/images";
import Logo from "@/components/ui/Logo";
import { useCart } from "@/components/cart/CartContext";
import { getProductBySlug, getProductsBySeries } from "@/lib/utils";

const LIGHT_TOP_PATTERN = /^\/products\//;

const collections = [
  { id: "joy", href: "/collections/joy" },
  { id: "up", href: "/collections/up" },
  { id: "art", href: "/collections/art" },
  { id: "quatro", href: "/collections/quatro" },
];

const menuLinks = [
  { key: "projects", href: "/projects" },
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
  "up-basin-mixer": "/images/nav-menu/products/up-basin-mixer-v2.png",
  "up-tall-basin-mixer": "/images/nav-menu/products/up-tall-basin-mixer.png",
  "up-wall-mounted-basin-mixer": "/images/nav-menu/products/up-wall-mounted-basin-mixer-v2.png",
  "up-concealed-shower": "/images/nav-menu/products/up-concealed-shower.png",
  "up-shower-column": "/images/nav-menu/products/up-shower-column.png",
  "up-free-standing-bath-mixer": "/images/nav-menu/products/up-free-standing-bath-mixer.png",
  "art-basin-mixer": "/images/nav-menu/products/art-basin-mixer-v2.png",
  "art-tall-basin-mixer": "/images/nav-menu/products/art-tall-basin-mixer.png",
  "art-wall-mounted-basin-mixer": "/images/nav-menu/products/art-wall-mounted-basin-mixer-v2.png",
  "art-concealed-shower": "/images/nav-menu/products/art-concealed-shower.png",
  "art-free-standing-bath-mixer": "/images/nav-menu/products/art-free-standing-bath-mixer.png",
  "quatro-basin-mixer": "/images/nav-menu/products/quatro-basin-mixer-v2.png",
  "quatro-tall-basin-mixer": "/images/nav-menu/products/quatro-tall-basin-mixer-v2.png",
  "quatro-wall-mounted-basin-mixer": "/images/nav-menu/products/quatro-wall-mounted-basin-mixer-v2.png",
  "quatro-concealed-shower": "/images/nav-menu/products/quatro-concealed-shower-v2.png",
};

const navMenuSlugs: Record<string, string[]> = {
  up: ["up-basin-mixer", "up-wall-mounted-basin-mixer", "up-shower-column", "up-free-standing-bath-mixer"],
  art: ["art-basin-mixer", "art-wall-mounted-basin-mixer", "art-concealed-shower", "art-free-standing-bath-mixer"],
};

export default function Navigation({ locale }: { locale: string }) {
  const t = useTranslations("nav");
  const tc = useTranslations("collections");
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<"collections" | "world">("collections");
  const [hoveredCollection, setHoveredCollection] = useState<string | null>(null);
  const { itemCount, setOpen: setCartOpen, cartIconRef, bump } = useCart();
  const useWhite = !LIGHT_TOP_PATTERN.test(pathname);

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

  const activeCollection = hoveredCollection ?? "joy";
  const curatedSlugs = navMenuSlugs[activeCollection];
  const activeProducts = curatedSlugs
    ? curatedSlugs.map((slug) => getProductBySlug(slug)).filter((product): product is NonNullable<typeof product> => Boolean(product))
    : getProductsBySeries(activeCollection).slice(0, 4);

  return (
    <>
      <nav className="absolute inset-x-0 top-0 z-30 bg-transparent">
        <div className="relative mx-auto flex h-[84px] max-w-[1920px] items-center justify-between px-5 sm:px-8 lg:h-[100px] lg:px-16">
          <button
            onClick={() => setMenuOpen(true)}
            className={`flex items-center gap-5 text-[15px] font-medium uppercase transition-colors duration-300 cursor-pointer ${
              useWhite ? "text-white hover:text-white/70" : "text-charcoal hover:text-charcoal/60"
            }`}
            aria-label={t("menu")}
          >
            <span className="flex h-10 w-14 flex-col justify-center gap-[8px]">
              <span className="block h-[1.5px] w-[52px] bg-current" />
              <span className="block h-[1.5px] w-[52px] bg-current" />
            </span>
            <span className="hidden sm:block">Menu</span>
          </button>

          <Link
            href="/"
            className="absolute left-1/2 top-1/2 shrink-0 -translate-x-1/2 -translate-y-1/2"
            aria-label="Steinheim home"
          >
            <Logo color={useWhite ? "light" : "dark"} size="md" showWave={false} />
          </Link>

          <div className="flex items-center gap-4 lg:gap-6">
            <Link
              href="/collections"
              className={`hidden transition-colors duration-300 sm:flex ${
                useWhite ? "text-white/80 hover:text-white" : "text-charcoal/55 hover:text-charcoal"
              }`}
              aria-label="Search collections"
            >
              <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
            </Link>
            <Link
              href="/contact"
              className={`hidden transition-colors duration-300 sm:flex ${
                useWhite ? "text-white/80 hover:text-white" : "text-charcoal/55 hover:text-charcoal"
              }`}
              aria-label="Account"
            >
              <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="8" r="4" />
                <path d="M5.5 21a6.5 6.5 0 0113 0" />
              </svg>
            </Link>
            <button
              ref={cartIconRef}
              onClick={() => setCartOpen(true)}
              className={`relative flex transition-colors duration-300 cursor-pointer ${
                useWhite ? "text-white/80 hover:text-white" : "text-charcoal/55 hover:text-charcoal"
              }`}
              aria-label="Cart"
            >
              <motion.span
                key={bump}
                initial={{ scale: 1 }}
                animate={{ scale: bump ? [1, 1.32, 1] : 1 }}
                transition={{ duration: 0.4, ease: [0.22, 0.76, 0.2, 1] }}
              >
                <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 8V6a5 5 0 0110 0v2" />
                  <path d="M5.5 8h13l1 12.5a1.5 1.5 0 01-1.5 1.5H6a1.5 1.5 0 01-1.5-1.5L5.5 8z" />
                </svg>
              </motion.span>
              {itemCount > 0 && (
                <motion.span
                  key={`count-${bump}`}
                  initial={{ scale: 0.6 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.35, ease: [0.22, 0.76, 0.2, 1] }}
                  className={`absolute -top-1.5 -right-1.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full px-0.5 text-[8px] font-medium ${
                    useWhite ? "bg-white text-black" : "bg-charcoal text-white"
                  }`}
                >
                  {itemCount}
                </motion.span>
              )}
            </button>
            <Link
              href={`/${locale === "en" ? "ar" : "en"}`}
              className={`hidden items-center gap-2 text-[12px] font-medium uppercase transition-colors duration-300 lg:flex ${
                useWhite ? "text-white/70 hover:text-white" : "text-charcoal/50 hover:text-charcoal"
              }`}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
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
            <div className="relative mx-0 my-0 h-[100svh] max-w-[1120px] overflow-hidden bg-[#ece9e2] shadow-[0_24px_80px_rgba(0,0,0,0.16)] sm:mx-3 sm:my-3 sm:h-[calc(100svh-24px)] sm:rounded-[22px] lg:mx-6 lg:my-6 lg:h-[calc(100vh-48px)]">
              <button
                onClick={() => setMenuOpen(false)}
                className="absolute left-5 top-5 z-10 flex items-center gap-3 text-[14px] font-medium uppercase text-black/65 hover:text-black transition-colors duration-300 cursor-pointer sm:left-7 sm:top-6 lg:left-10 lg:top-8"
                aria-label={t("close")}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.3">
                  <line x1="4" y1="4" x2="16" y2="16" />
                  <line x1="16" y1="4" x2="4" y2="16" />
                </svg>
                <span className="hidden sm:inline">Close</span>
              </button>

              <div className="flex h-full">
              <div className="flex w-full flex-col overflow-y-auto px-6 pb-6 pt-6 lg:w-[36%] lg:px-10 lg:pb-8 lg:pt-8">
                <div className="mb-8 lg:mb-12">
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
                          className="group overflow-hidden bg-black text-white"
                        >
                          <div className="relative aspect-[4/5]">
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

              <div className="hidden flex-1 px-0.5 pb-0.5 pt-6 lg:block lg:pt-8">
                <div className="flex h-full flex-col rounded-[18px] bg-[#ece9e2] p-0.5">
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
                        <div className="grid flex-1 grid-cols-2 grid-rows-2 gap-4">
                          {worldLinks.map((item, index) => (
                            <motion.div
                              key={item.label}
                              initial={{ opacity: 0, y: 14 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.045, duration: 0.38, ease: [0.22, 0.76, 0.2, 1] }}
                              className="h-full"
                            >
                              <Link
                                href={item.href}
                                onClick={handleNavigate}
                                className="group relative block h-full overflow-hidden bg-black"
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
                                <div className="absolute inset-x-0 bottom-0 px-4 pb-2 pt-8 text-white">
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
                        <div className="grid flex-1 grid-cols-2 grid-rows-2 gap-4">
                          {activeProducts.map((product, index) => {
                            const image = menuProductImages[product.slug] ?? getProductDefaultImage(product.slug);

                            return (
                              <motion.div
                                key={product.slug}
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.045, duration: 0.38, ease: [0.22, 0.76, 0.2, 1] }}
                                className="h-full"
                              >
                                <Link
                                  href={`/products/${product.slug}`}
                                  onClick={handleNavigate}
                                  className="group relative block h-full overflow-hidden bg-black shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]"
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
                                  <div className="absolute inset-x-0 bottom-0 px-4 pb-2 pt-8 text-white">
                                    <p className="font-heading text-[24px] leading-none tracking-[-0.04em] text-white">
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
