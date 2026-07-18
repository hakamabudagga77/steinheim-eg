"use client";

import dynamic from "next/dynamic";
import Navigation from "@/components/layout/Navigation";
import ConditionalFooter from "@/components/layout/ConditionalFooter";
import BackToTop from "@/components/ui/BackToTop";
import SmoothScroll from "@/components/ui/SmoothScroll";
import { TradeProjectProvider } from "@/components/catalogue/TradeProjectContext";
import { CartProvider } from "@/components/cart/CartContext";

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
const CartDrawer = dynamic(() => import("@/components/cart/CartDrawer"), {
  ssr: false,
});
const FloatingRoomProgress = dynamic(
  () => import("@/components/trade/FloatingRoomProgress"),
  { ssr: false }
);

export default function SiteShell({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: string;
}) {
  return (
    <CartProvider>
      <TradeProjectProvider>
        <Navigation locale={locale} />
        <main className="flex-1">{children}</main>
        <ConditionalFooter />
        <TradeProjectDrawer locale={locale} />
        <TradeSetupOverlay locale={locale} />
        <CartDrawer locale={locale} />
        <FloatingRoomProgress locale={locale} />
        <BackToTop />
        <SmoothScroll />
      </TradeProjectProvider>
    </CartProvider>
  );
}
