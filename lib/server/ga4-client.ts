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
  sessions: number;
  pageViews: number;
  avgSessionDuration: number;
  topPages: Array<{ path: string; views: number }>;
  topSources: Array<{ source: string; sessions: number }>;
  dailyUsers: Array<{ date: string; users: number }>;
}

export async function fetchGA4Summary(startDate: string, endDate: string): Promise<GA4Summary> {
  const client = getClient();
  const property = propertyPath();

  const [totals, byDay, byPage, bySource] = await Promise.all([
    client.runReport({
      property,
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: "activeUsers" },
        { name: "sessions" },
        { name: "screenPageViews" },
        { name: "averageSessionDuration" },
      ],
    }),
    client.runReport({
      property,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "date" }],
      metrics: [{ name: "activeUsers" }],
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
  ]);

  const totalsRow = totals[0].rows?.[0]?.metricValues;

  return {
    activeUsers: Number(totalsRow?.[0]?.value ?? 0),
    sessions: Number(totalsRow?.[1]?.value ?? 0),
    pageViews: Number(totalsRow?.[2]?.value ?? 0),
    avgSessionDuration: Number(totalsRow?.[3]?.value ?? 0),
    dailyUsers: (byDay[0].rows ?? []).map((row) => ({
      date: row.dimensionValues?.[0]?.value ?? "",
      users: Number(row.metricValues?.[0]?.value ?? 0),
    })),
    topPages: (byPage[0].rows ?? []).map((row) => ({
      path: row.dimensionValues?.[0]?.value ?? "",
      views: Number(row.metricValues?.[0]?.value ?? 0),
    })),
    topSources: (bySource[0].rows ?? []).map((row) => ({
      source: row.dimensionValues?.[0]?.value || "(direct)",
      sessions: Number(row.metricValues?.[0]?.value ?? 0),
    })),
  };
}
