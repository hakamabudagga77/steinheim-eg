import "server-only";

import { BetaAnalyticsDataClient } from "@google-analytics/data";

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
}

export async function fetchGA4Summary(startDate: string, endDate: string): Promise<GA4Summary> {
  const client = getClient();
  const property = propertyPath();

  const [totals, byDay, byPage, bySource, byChannel, byDevice, byCountry, byLandingPage] = await Promise.all([
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
  };
}
