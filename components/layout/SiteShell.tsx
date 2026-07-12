"use client";

import Navigation from "@/components/layout/Navigation";
import ConditionalFooter from "@/components/layout/ConditionalFooter";
import BackToTop from "@/components/ui/BackToTop";
import SmoothScroll from "@/components/ui/SmoothScroll";
import TradeProjectDrawer from "@/components/catalogue/TradeProjectDrawer";
import { TradeProjectProvider } from "@/components/catalogue/TradeProjectContext";
import CartDrawer from "@/components/cart/CartDrawer";
import { CartProvider } from "@/components/cart/CartContext";
import WishlistDrawer from "@/components/wishlist/WishlistDrawer";
import { WishlistProvider } from "@/components/wishlist/WishlistContext";

export default function SiteShell({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: string;
}) {
  return (
    <CartProvider>
      <WishlistProvider>
        <TradeProjectProvider>
          <Navigation locale={locale} />
          <main className="flex-1">{children}</main>
          <ConditionalFooter />
          <TradeProjectDrawer locale={locale} />
          <CartDrawer locale={locale} />
          <WishlistDrawer locale={locale} />
          <BackToTop />
          <SmoothScroll />
        </TradeProjectProvider>
      </WishlistProvider>
    </CartProvider>
  );
}
