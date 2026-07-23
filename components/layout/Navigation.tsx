"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import Image from "next/image";
import { getProductDefaultImage } from "@/data/images";
import Logo from "@/components/ui/Logo";
import { useCart } from "@/components/cart/CartContext";
import { useWishlist } from "@/components/wishlist/WishlistContext";
import { useTradeProject } from "@/components/catalogue/TradeProjectContext";
import { hasActiveRoomNeeds } from "@/lib/trade-project";
import { getProductBySlug, getProductsBySeries } from "@/lib/utils";

const LIGHT_TOP_PATTERN = /^\/products(\/|$)/;

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
    labelKey: "world.company" as const,
    eyebrowKey: "world.companyEyebrow" as const,
    href: "/about",
    image: "/images/generated/gessi/steinheim-specification-story.png",
  },
  {
    labelKey: "world.finishes" as const,
    eyebrowKey: "world.finishesEyebrow" as const,
    href: "/about#finishes",
    image: "/images/generated/gessi/steinheim-finish-stack.png",
  },
  {
    labelKey: "world.tradeStudio" as const,
    eyebrowKey: "world.tradeStudioEyebrow" as const,
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
  "quatro-basin-mixer": "/images/nav-menu/products/quatro-tall-basin-mixer-v2.png",
  "quatro-tall-basin-mixer": "/images/nav-menu/products/quatro-basin-mixer-v2.png",
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
  const tm = useTranslations("menu");
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<"collections" | "world">("collections");
  const [hoveredCollection, setHoveredCollection] = useState<string | null>(null);
  const { itemCount, setOpen: setCartOpen, cartIconRef, bump } = useCart();
  const { itemCount: wishlistCount, setOpen: setWishlistOpen } = useWishlist();
  const {
    project: tradeProject,
    setOpen: setTradeOpen,
    projectIconRef,
    bump: tradeBump,
    unreadMessageCount,
  } = useTradeProject();
  const tradeItemCount = tradeProject.items.length;
  const showShopByNeed = hasActiveRoomNeeds(tradeProject);
  const projectDisplayName = tradeProject.details.projectName || tm("yourProject");
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
            <span className="hidden sm:block">{t("menu")}</span>
          </button>

          <Link
            href="/"
            className="absolute left-1/2 top-1/2 flex shrink-0 -translate-x-1/2 -translate-y-1/2 items-center gap-2.5"
            aria-label="Steinheim home"
          >
            <Logo color={useWhite ? "light" : "dark"} size="md" />
            {showShopByNeed && (
              <span
                className={`hidden whitespace-nowrap font-heading text-[39px] tracking-[-0.06em] lg:inline ${
                  useWhite ? "text-white" : "text-charcoal"
                }`}
                style={{ fontStyle: "italic" }}
              >
                × {projectDisplayName}
              </span>
            )}
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
              ref={projectIconRef}
              onClick={() => setTradeOpen(true)}
              className={`relative hidden transition-colors duration-300 cursor-pointer sm:flex ${
                useWhite ? "text-white/80 hover:text-white" : "text-charcoal/55 hover:text-charcoal"
              }`}
              aria-label="Trade project board"
              title="Trade project board"
            >
              <motion.span
                key={tradeBump}
                initial={{ scale: 1 }}
                animate={{ scale: tradeBump ? [1, 1.32, 1] : 1 }}
                transition={{ duration: 0.4, ease: [0.22, 0.76, 0.2, 1] }}
              >
                <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 4h6a1 1 0 011 1v1h1.5A1.5 1.5 0 0119 7.5v11A1.5 1.5 0 0117.5 20h-11A1.5 1.5 0 015 18.5v-11A1.5 1.5 0 016.5 6H8V5a1 1 0 011-1z" />
                  <path d="M9 4v3h6V4" />
                  <path d="M9 12h6M9 15.5h6M9 8.5h3" />
                </svg>
              </motion.span>
              {tradeItemCount > 0 && (
                <motion.span
                  key={`trade-count-${tradeBump}`}
                  initial={{ scale: 0.6 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.35, ease: [0.22, 0.76, 0.2, 1] }}
                  className={`absolute -top-1.5 -right-1.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full px-0.5 text-[8px] font-medium ${
                    useWhite ? "bg-white text-black" : "bg-charcoal text-white"
                  }`}
                >
                  {tradeItemCount}
                </motion.span>
              )}
              {unreadMessageCount > 0 && (
                <motion.span
                  initial={{ scale: 0.6 }}
                  animate={{ scale: [1, 1.25, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                  className={`absolute -top-1 -left-1 h-2.5 w-2.5 rounded-full ${useWhite ? "bg-white" : "bg-charcoal"}`}
                  aria-label={`${unreadMessageCount} new message${unreadMessageCount === 1 ? "" : "s"} from Steinheim`}
                />
              )}
            </button>
            <button
              onClick={() => setWishlistOpen(true)}
              className={`relative hidden transition-colors duration-300 cursor-pointer sm:flex ${
                useWhite ? "text-white/80 hover:text-white" : "text-charcoal/55 hover:text-charcoal"
              }`}
              aria-label={t("wishlist")}
              title={t("wishlist")}
            >
              <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {wishlistCount > 0 && (
                <span
                  className={`absolute -top-1.5 -right-1.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full px-0.5 text-[8px] font-medium ${
                    useWhite ? "bg-white text-black" : "bg-charcoal text-white"
                  }`}
                >
                  {wishlistCount}
                </span>
              )}
            </button>
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
              href={pathname}
              locale={locale === "en" ? "ar" : "en"}
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
            data-lenis-prevent
            className="fixed inset-0 z-[60] bg-black/35 text-charcoal backdrop-blur-md"
          >
            <div className="relative mx-0 my-0 h-[100svh] max-w-[1120px] overflow-hidden bg-[#ece9e2] shadow-[0_24px_80px_rgba(0,0,0,0.16)] sm:mx-3 sm:my-3 sm:h-[calc(100svh-24px)] lg:mx-6 lg:my-6 lg:h-[calc(100vh-48px)]">
              <button
                onClick={() => setMenuOpen(false)}
                className="absolute left-5 top-5 z-10 flex items-center gap-3 text-[14px] font-medium uppercase text-black/65 hover:text-black transition-colors duration-300 cursor-pointer sm:left-7 sm:top-6 lg:left-10 lg:top-8"
                aria-label={t("close")}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.3">
                  <line x1="4" y1="4" x2="16" y2="16" />
                  <line x1="16" y1="4" x2="4" y2="16" />
                </svg>
                <span className="hidden sm:inline">{t("close")}</span>
              </button>

              <div className="flex h-full">
              <div className="flex w-full flex-col overflow-y-auto px-6 pb-6 pt-20 lg:w-[36%] lg:px-10 lg:pb-8 lg:pt-24 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="mb-8 lg:mb-12">
                  <div className="space-y-1">
                    {showShopByNeed && (
                      <motion.div
                        className="mb-3"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.06, duration: 0.5, ease: [0.22, 0.76, 0.2, 1] }}
                      >
                        <div className="mb-1.5 inline-flex items-center gap-1.5 bg-black px-2.5 py-1">
                          <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white">{tm("forYourProject")}</span>
                        </div>
                        <Link
                          href="/shop-by-need"
                          onClick={handleNavigate}
                          style={{ fontStyle: "italic" }}
                          className={`block py-1 text-[clamp(2.1rem,10vw,2.8rem)] font-medium leading-[1.05] text-black transition-all duration-400 lg:text-[clamp(1.5rem,2.3vw,2.8rem)] lg:leading-[1.15] ${
                            pathname === "/shop-by-need" ? "" : "hover:translate-x-2"
                          }`}
                        >
                          {tm("shopFor", { name: projectDisplayName })}
                        </Link>
                      </motion.div>
                    )}
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
                        {t("collections")}
                      </Link>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.12, duration: 0.5, ease: [0.22, 0.76, 0.2, 1] }}
                    >
                      <Link
                        href="/products"
                        onClick={handleNavigate}
                        onMouseEnter={() => setActivePanel("collections")}
                        className={`block py-2 text-[clamp(1.6rem,7vw,2.1rem)] font-normal leading-[1.05] text-black/45 transition-all duration-400 hover:translate-x-2 hover:text-black lg:text-[clamp(1.1rem,1.7vw,2.1rem)] lg:leading-[1.15] ${
                          pathname === "/products" ? "text-black" : ""
                        }`}
                      >
                        {t("allProducts")}
                      </Link>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.13, duration: 0.5, ease: [0.22, 0.76, 0.2, 1] }}
                    >
                      <Link
                        href="/best-sellers"
                        onClick={handleNavigate}
                        onMouseEnter={() => setActivePanel("collections")}
                        className={`block py-2 text-[clamp(1.6rem,7vw,2.1rem)] font-normal leading-[1.05] text-black/45 transition-all duration-400 hover:translate-x-2 hover:text-black lg:text-[clamp(1.1rem,1.7vw,2.1rem)] lg:leading-[1.15] ${
                          pathname === "/best-sellers" ? "text-black" : ""
                        }`}
                      >
                        {t("bestSellers")}
                      </Link>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.14, duration: 0.5, ease: [0.22, 0.76, 0.2, 1] }}
                    >
                      <Link
                        href="/shop-the-look"
                        onClick={handleNavigate}
                        onMouseEnter={() => setActivePanel("collections")}
                        className={`block py-2 text-[clamp(1.6rem,7vw,2.1rem)] font-normal leading-[1.05] text-black/45 transition-all duration-400 hover:translate-x-2 hover:text-black lg:text-[clamp(1.1rem,1.7vw,2.1rem)] lg:leading-[1.15] ${
                          pathname === "/shop-the-look" ? "text-black" : ""
                        }`}
                      >
                        {t("shopTheLook")}
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
                            <p className="absolute inset-x-0 bottom-4 px-3 text-center font-heading text-[18px] leading-none tracking-[-0.04em]">
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
                    {tm("ourWorld")}
                  </p>
                  <div className="space-y-1">
                    {worldLinks.map((link, index) => (
                      <motion.div
                        key={link.labelKey}
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
                          {tm(link.labelKey)}
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

                {/* Language toggle for mobile/tablet — the top-bar switcher is
                    desktop-only (lg:flex), so without this there is no way to
                    change language on small screens. Hidden on lg+ to avoid
                    duplicating the top-bar control. */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.4, ease: [0.22, 0.76, 0.2, 1] }}
                  className="mt-6 lg:hidden"
                >
                  <Link
                    href={pathname}
                    locale={locale === "en" ? "ar" : "en"}
                    onClick={handleNavigate}
                    className="flex items-center gap-2.5 py-2 text-[14px] font-medium text-black/50 transition-colors duration-300 hover:text-black"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                    </svg>
                    <span>{locale === "en" ? "العربية" : "English"}</span>
                  </Link>
                </motion.div>

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
                <div className="flex h-full flex-col bg-[#ece9e2]">
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
                              key={item.labelKey}
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
                                  alt={tm(item.labelKey)}
                                  fill
                                  sizes="32vw"
                                  className="object-cover transition duration-[1200ms] group-hover:scale-[1.08]"
                                  priority={index < 2}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/62 via-black/10 to-transparent transition duration-500 group-hover:from-black/78 group-hover:via-black/25" />
                                <div className="absolute inset-x-0 bottom-0 px-4 pb-2 pt-8 text-white">
                                  <p className="text-[10px] uppercase tracking-[0.28em] text-white/62">
                                    {tm(item.eyebrowKey)}
                                  </p>
                                  <p className="mt-2 text-[24px] leading-none tracking-[-0.04em]">
                                    {tm(item.labelKey)}
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
                                      className="object-cover transition duration-[1200ms] group-hover:scale-[1.08]"
                                      priority={index < 2}
                                    />
                                  ) : null}
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/8 to-transparent transition duration-500 group-hover:from-black/88 group-hover:via-black/25" />
                                  <div className="absolute inset-x-0 bottom-6 px-5 pt-8 text-center text-white">
                                    <p className="font-heading text-[18px] leading-none tracking-[-0.04em] text-white">
                                      {product.name}
                                    </p>
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
