"use client";

import { useEffect } from "react";
import { captureAttribution } from "@/lib/attribution";

/**
 * Records the campaign parameters of the landing URL so they can be re-attached
 * to the Shopify checkout handoff later. Without this the ad that produced a
 * sale is lost the moment the visitor leaves the storefront — see
 * lib/attribution.ts.
 *
 * Runs once per page load rather than on every route change: campaign
 * parameters only ever appear on the entry URL.
 */
export default function AttributionCapture() {
  useEffect(() => {
    captureAttribution(window.location.search);
  }, []);

  return null;
}
