"use client";

import dynamic from "next/dynamic";
import { MotionConfig } from "framer-motion";
import { useTranslations } from "next-intl";
import Navigation from "@/components/layout/Navigation";
import ConditionalFooter from "@/components/layout/ConditionalFooter";
import BackToTop from "@/components/ui/BackToTop";
import SmoothScroll from "@/components/ui/SmoothScroll";
import { TradeProjectProvider } from "@/components/catalogue/TradeProjectContext";
import { CartProvider } from "@/components/cart/CartContext";
import { WishlistProvider } from "@/components/wishlist/WishlistContext";
import { ComparisonProvider } from "@/components/comparison/ComparisonContext";

// These overlays stay closed until the user opens them, so their (large)
// bundles load lazily instead of blocking every page's initial JS.
const TradeProjectDrawer = dynamic(
  () => import("@/components/catalogue/TradeProjectDrawer"),
  { ssr: false }
);
const TradeSetupOverlay = dynamic(
  () => import("@/components/trade/TradeSetupOverlay"),
  { ssr: false }
);
const TradeLeadPopup = dynamic(
  () => import("@/components/trade/TradeLeadPopup"),
  { ssr: false }
);
const CartDrawer = dynamic(() => import("@/components/cart/CartDrawer"), {
  ssr: false,
});
const FloatingRoomProgress = dynamic(
  () => import("@/components/trade/FloatingRoomProgress"),
  { ssr: false }
);
const SiteSearch = dynamic(() => import("@/components/search/SiteSearch"), {
  ssr: false,
});
const WishlistDrawer = dynamic(
  () => import("@/components/wishlist/WishlistDrawer"),
  { ssr: false }
);
const CompareBar = dynamic(
  () => import("@/components/comparison/CompareBar"),
  { ssr: false }
);
const DesignerConcierge = dynamic(
  () => import("@/components/ui/DesignerConcierge"),
  { ssr: false }
);

export default function SiteShell({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: string;
}) {
  const t = useTranslations("a11y");

  return (
    <MotionConfig reducedMotion="user">
      <CartProvider>
        <WishlistProvider>
          <ComparisonProvider>
            <TradeProjectProvider>
              <a
                href="#main"
                className="sr-only z-[300] focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-[13px] focus:text-charcoal"
              >
                {t("skipToContent")}
              </a>
              <Navigation locale={locale} />
              <main id="main" tabIndex={-1} className="flex-1 outline-none">
                {children}
              </main>
              <ConditionalFooter />
              <TradeProjectDrawer locale={locale} />
              <TradeSetupOverlay locale={locale} />
              <TradeLeadPopup />
              <CartDrawer locale={locale} />
              <WishlistDrawer locale={locale} />
              <FloatingRoomProgress locale={locale} />
              <SiteSearch />
              <BackToTop />
              <SmoothScroll />
              <CompareBar />
              <DesignerConcierge locale={locale} />
            </TradeProjectProvider>
          </ComparisonProvider>
        </WishlistProvider>
      </CartProvider>
    </MotionConfig>
  );
}
