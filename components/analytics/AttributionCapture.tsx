"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { captureAttribution } from "@/lib/checkout-attribution";

/**
 * Records which channel brought the shopper here, so the cart drawer can
 * re-attach it to the Shopify checkout link. Renders nothing.
 *
 * Re-runs on navigation because the ad click may land on any page, and an
 * App Router route change does not remount this component.
 */
export default function AttributionCapture() {
  const pathname = usePathname();

  useEffect(() => {
    captureAttribution();
  }, [pathname]);

  return null;
}
