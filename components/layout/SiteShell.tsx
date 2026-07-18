"use client";

import Navigation from "@/components/layout/Navigation";
import ConditionalFooter from "@/components/layout/ConditionalFooter";
import BackToTop from "@/components/ui/BackToTop";
import SmoothScroll from "@/components/ui/SmoothScroll";
import TradeProjectDrawer from "@/components/catalogue/TradeProjectDrawer";
import { TradeProjectProvider } from "@/components/catalogue/TradeProjectContext";
import TradeSetupOverlay from "@/components/trade/TradeSetupOverlay";
import FloatingRoomProgress from "@/components/trade/FloatingRoomProgress";
import CartDrawer from "@/components/cart/CartDrawer";
import { CartProvider } from "@/components/cart/CartContext";

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
