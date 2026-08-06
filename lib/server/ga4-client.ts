import "server-only";

import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { redisGet, redisSetEx } from "@/lib/server/redis";

let cachedClient: BetaAnalyticsDataClient | null = null;

function getClient() {
  if (cachedClient) return cachedClient;

  const email = process.env.GA4_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GA4_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!email || !privateKey) throw new Error("GA4_NOT_CONFIGURED");

  cachedClient = new BetaAnalyticsDataClient({
    credentials: {
      client_email: email,
      private_key: privateKey.replace(/\\n/g, "\n"),
    },
  });
  return cachedClient;
}

function propertyPath() {
  const propertyId = process.env.GA4_PROPERTY_ID;
  if (!propertyId) throw new Error("GA4_PROPERTY_ID_NOT_CONFIGURED");
  return `properties/${propertyId}`;
}

export interface GA4PreviousPeriod {
  activeUsers: number;
  newUsers: number;
  sessions: number;
  pageViews: number;
}

export interface GA4FunnelStage {
  stage: "sessions" | "view_item" | "add_to_cart" | "begin_checkout" | "purchase";
  count: number;
}

export interface GA4Summary {
  activeUsers: number;
  newUsers: number;
  sessions: number;
  pageViews: number;
  avgSessionDuration: number;
  engagementRate: number;
  bounceRate: number;
  pagesPerSession: number;
  topPages: Array<{ path: string; views: number }>;
  topSources: Array<{ source: string; sessions: number }>;
  dailyUsers: Array<{ date: string; users: number; sessions: number }>;
  topChannels: Array<{ channel: string; sessions: number }>;
  devices: Array<{ device: string; sessions: number }>;
  topCountries: Array<{ country: string; users: number }>;
  landingPages: Array<{ path: string; sessions: number }>;
  // Null when the requested range isn't a concrete YYYY-MM-DD pair (e.g. a
  // legacy relative string like "30daysAgo") -- there's no reliable prior
  // window to diff against in that case.
  previousPeriod: GA4PreviousPeriod | null;
  funnel: GA4FunnelStage[];
  localeSplit: { en: number; ar: number; other: number };
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function shiftDate(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// The immediately-preceding window of the same length, e.g. for
// [2026-08-01, 2026-08-07] (7 days) this returns [2026-07-25, 2026-07-31].
function previousPeriodRange(startDate: string, endDate: string): { start: string; end: string } | null {
  if (!ISO_DATE_RE.test(startDate) || !ISO_DATE_RE.test(endDate)) return null;
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return null;
  const rangeDays = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  const prevEnd = shiftDate(startDate, -1);
  const prevStart = shiftDate(prevEnd, -(rangeDays - 1));
  return { start: prevStart, end: prevEnd };
}

const FUNNEL_EVENTS = ["view_item", "add_to_cart", "begin_checkout", "purchase"] as const;

const CACHE_TTL_SECONDS = 5 * 60;

// Per-instance fallback for when Redis isn't configured (local dev), keyed by
// date range since GA4Summary is scoped per range unlike the Shopify cache.
const memoryCache = new Map<string, { data: GA4Summary; fetchedAt: number }>();

async function fetchGA4SummaryUncached(startDate: string, endDate: string): Promise<GA4Summary> {
  const client = getClient();
  const property = propertyPath();
  const prevRange = previousPeriodRange(startDate, endDate);

  const [totals, byDay, byPage, bySource, byChannel, byDevice, byCountry, byLandingPage, byEvent, byLandingLocale, prevTotals] = await Promise.all([
    client.runReport({
      property,
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: "activeUsers" },
        { name: "sessions" },
        { name: "screenPageViews" },
        { name: "averageSessionDuration" },
        { name: "newUsers" },
        { name: "engagementRate" },
        { name: "bounceRate" },
      ],
    }),
    client.runReport({
      property,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "date" }],
      metrics: [{ name: "activeUsers" }, { name: "sessions" }],
      orderBys: [{ dimension: { dimensionName: "date" } }],
    }),
    client.runReport({
      property,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "pagePath" }],
      metrics: [{ name: "screenPageViews" }],
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      limit: 10,
    }),
    client.runReport({
      property,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "sessionSource" }],
      metrics: [{ name: "sessions" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 10,
    }),
    client.runReport({ property, dateRanges: [{ startDate, endDate }], dimensions: [{ name: "sessionDefaultChannelGroup" }], metrics: [{ name: "sessions" }], orderBys: [{ metric: { metricName: "sessions" }, desc: true }], limit: 8 }),
    client.runReport({ property, dateRanges: [{ startDate, endDate }], dimensions: [{ name: "deviceCategory" }], metrics: [{ name: "sessions" }], orderBys: [{ metric: { metricName: "sessions" }, desc: true }], limit: 5 }),
    client.runReport({ property, dateRanges: [{ startDate, endDate }], dimensions: [{ name: "country" }], metrics: [{ name: "activeUsers" }], orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }], limit: 8 }),
    client.runReport({ property, dateRanges: [{ startDate, endDate }], dimensions: [{ name: "landingPagePlusQueryString" }], metrics: [{ name: "sessions" }], orderBys: [{ metric: { metricName: "sessions" }, desc: true }], limit: 8 }),
    client.runReport({
      property,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "eventName" }],
      metrics: [{ name: "eventCount" }],
      dimensionFilter: { filter: { fieldName: "eventName", inListFilter: { values: [...FUNNEL_EVENTS] } } },
      limit: FUNNEL_EVENTS.length,
    }),
    // Session-scoped landing page, bucketed by /en//ar prefix below -- there's
    // no dedicated "site locale" dimension without a custom GA4 definition,
    // and the URL locale prefix is a reliable proxy since every route is
    // localized. A generous limit keeps the en/ar/other split accurate even
    // on a long tail of landing pages.
    client.runReport({
      property,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "landingPage" }],
      metrics: [{ name: "sessions" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 100,
    }),
    prevRange
      ? client.runReport({
          property,
          dateRanges: [{ startDate: prevRange.start, endDate: prevRange.end }],
          metrics: [{ name: "activeUsers" }, { name: "sessions" }, { name: "screenPageViews" }, { name: "newUsers" }],
        })
      : Promise.resolve(null),
  ]);

  const totalsRow = totals[0].rows?.[0]?.metricValues;

  return {
    activeUsers: Number(totalsRow?.[0]?.value ?? 0),
    sessions: Number(totalsRow?.[1]?.value ?? 0),
    pageViews: Number(totalsRow?.[2]?.value ?? 0),
    avgSessionDuration: Number(totalsRow?.[3]?.value ?? 0),
    newUsers: Number(totalsRow?.[4]?.value ?? 0),
    engagementRate: Number(totalsRow?.[5]?.value ?? 0),
    bounceRate: Number(totalsRow?.[6]?.value ?? 0),
    pagesPerSession: Number(totalsRow?.[1]?.value ?? 0) > 0 ? Number(totalsRow?.[2]?.value ?? 0) / Number(totalsRow?.[1]?.value ?? 1) : 0,
    dailyUsers: (byDay[0].rows ?? []).map((row) => ({
      date: row.dimensionValues?.[0]?.value ?? "",
      users: Number(row.metricValues?.[0]?.value ?? 0),
      sessions: Number(row.metricValues?.[1]?.value ?? 0),
    })),
    topPages: (byPage[0].rows ?? []).map((row) => ({
      path: row.dimensionValues?.[0]?.value ?? "",
      views: Number(row.metricValues?.[0]?.value ?? 0),
    })),
    topSources: (bySource[0].rows ?? []).map((row) => ({
      source: row.dimensionValues?.[0]?.value || "(direct)",
      sessions: Number(row.metricValues?.[0]?.value ?? 0),
    })),
    topChannels: (byChannel[0].rows ?? []).map((row) => ({ channel: row.dimensionValues?.[0]?.value || "Unassigned", sessions: Number(row.metricValues?.[0]?.value ?? 0) })),
    devices: (byDevice[0].rows ?? []).map((row) => ({ device: row.dimensionValues?.[0]?.value || "unknown", sessions: Number(row.metricValues?.[0]?.value ?? 0) })),
    topCountries: (byCountry[0].rows ?? []).map((row) => ({ country: row.dimensionValues?.[0]?.value || "Unknown", users: Number(row.metricValues?.[0]?.value ?? 0) })),
    landingPages: (byLandingPage[0].rows ?? []).map((row) => ({ path: row.dimensionValues?.[0]?.value || "/", sessions: Number(row.metricValues?.[0]?.value ?? 0) })),
    funnel: buildFunnel(Number(totalsRow?.[1]?.value ?? 0), byEvent[0].rows ?? []),
    localeSplit: buildLocaleSplit(byLandingLocale[0].rows ?? []),
    previousPeriod: prevTotals
      ? {
          activeUsers: Number(prevTotals[0].rows?.[0]?.metricValues?.[0]?.value ?? 0),
          sessions: Number(prevTotals[0].rows?.[0]?.metricValues?.[1]?.value ?? 0),
          pageViews: Number(prevTotals[0].rows?.[0]?.metricValues?.[2]?.value ?? 0),
          newUsers: Number(prevTotals[0].rows?.[0]?.metricValues?.[3]?.value ?? 0),
        }
      : null,
  };
}

interface GA4Row {
  dimensionValues?: Array<{ value?: string | null }> | null;
  metricValues?: Array<{ value?: string | null }> | null;
}

function buildFunnel(sessions: number, eventRows: GA4Row[]): GA4FunnelStage[] {
  const countByEvent = new Map(eventRows.map((row) => [row.dimensionValues?.[0]?.value ?? "", Number(row.metricValues?.[0]?.value ?? 0)]));
  return [
    { stage: "sessions", count: sessions },
    ...FUNNEL_EVENTS.map((stage) => ({ stage, count: countByEvent.get(stage) ?? 0 })),
  ];
}

function buildLocaleSplit(landingRows: GA4Row[]): { en: number; ar: number; other: number } {
  const split = { en: 0, ar: 0, other: 0 };
  for (const row of landingRows) {
    const path = row.dimensionValues?.[0]?.value ?? "";
    const sessions = Number(row.metricValues?.[0]?.value ?? 0);
    if (path === "/ar" || path.startsWith("/ar/") || path.startsWith("/ar?")) split.ar += sessions;
    else if (path === "/en" || path.startsWith("/en/") || path.startsWith("/en?")) split.en += sessions;
    else split.other += sessions;
  }
  return split;
}

export async function fetchGA4Summary(startDate: string, endDate: string): Promise<GA4Summary> {
  const cacheKey = `steinheim:ga4:${startDate}:${endDate}`;

  const cached = await redisGet(cacheKey).catch(() => null);
  if (cached) {
    try {
      return JSON.parse(cached) as GA4Summary;
    } catch {
      // Corrupt cache entry — fall through and refetch.
    }
  }

  const fromMemory = memoryCache.get(cacheKey);
  if (!cached && fromMemory && Date.now() - fromMemory.fetchedAt < CACHE_TTL_SECONDS * 1000) {
    return fromMemory.data;
  }

  const data = await fetchGA4SummaryUncached(startDate, endDate);
  memoryCache.set(cacheKey, { data, fetchedAt: Date.now() });
  await redisSetEx(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(data)).catch(() => {});
  return data;
}
