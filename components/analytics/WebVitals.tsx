"use client";

import { useReportWebVitals } from "next/web-vitals";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

// Module-scope callback: useReportWebVitals re-reports already-collected
// metrics whenever it receives a new function reference, so the reference must
// stay stable across renders to avoid duplicate events.
const reportToGA4: Parameters<typeof useReportWebVitals>[0] = (metric) => {
  // GA4 is optional (NEXT_PUBLIC_GA4_ID); silently no-op when gtag isn't there.
  if (typeof window.gtag !== "function") return;
  window.gtag("event", metric.name, {
    // GA event values must be integers; CLS is a small float, so scale it.
    value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
    event_label: metric.id,
    metric_rating: metric.rating,
    non_interaction: true,
  });
};

// Field measurement of Core Web Vitals (LCP/CLS/INP/TTFB/FCP) from real
// visitors, sent to the site's existing GA4 property so performance is
// queryable next to traffic data the team already owns. Complements Vercel
// Speed Insights (which reports the same signals into Vercel's dashboard).
export default function WebVitals() {
  useReportWebVitals(reportToGA4);
  return null;
}
