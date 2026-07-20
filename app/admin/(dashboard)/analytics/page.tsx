"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Users, Activity, Eye, Clock } from "lucide-react";
import { PageHeader, Panel, StatCard, StatCardSkeleton, ErrorState, SegmentedControl } from "@/components/admin/ui";

// recharts (~120 KB gzip) loads on demand instead of in this page's initial JS.
const VisitorsAreaChart = dynamic(() => import("./AnalyticsChart").then((m) => m.VisitorsAreaChart), {
  ssr: false,
  loading: () => <div className="h-full animate-pulse rounded-lg bg-white/[0.04]" />,
});

type Timeframe = "7d" | "30d" | "90d";

const TIMEFRAME_OPTIONS: Array<{ value: Timeframe; label: string }> = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
];

const TIMEFRAME_DAYS: Record<Timeframe, string> = {
  "7d": "7daysAgo",
  "30d": "30daysAgo",
  "90d": "90daysAgo",
};

interface GA4Summary {
  activeUsers: number;
  sessions: number;
  pageViews: number;
  avgSessionDuration: number;
  topPages: Array<{ path: string; views: number }>;
  topSources: Array<{ source: string; sessions: number }>;
  dailyUsers: Array<{ date: string; users: number }>;
}

function fmtDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

function AnalyticsData({ timeframe }: { timeframe: Timeframe }) {
  const [summary, setSummary] = useState<GA4Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/analytics?start=${TIMEFRAME_DAYS[timeframe]}&end=today`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Could not load analytics.");
        }
        return res.json();
      })
      .then((data) => setSummary(data.summary))
      .catch((err) => setError(err.message));
  }, [timeframe]);

  if (error) {
    return (
      <ErrorState>
        {error}
        {error.includes("not configured") && (
          <span className="mt-2 block text-white/40">
            Needs <code className="rounded bg-white/[0.08] px-1.5 py-0.5">GA4_PROPERTY_ID</code> set in the environment.
          </span>
        )}
      </ErrorState>
    );
  }

  return (
    <>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summary ? (
          <>
            <StatCard icon={Users} label="Visitors" value={summary.activeUsers.toLocaleString()} accent />
            <StatCard icon={Activity} label="Sessions" value={summary.sessions.toLocaleString()} />
            <StatCard icon={Eye} label="Page views" value={summary.pageViews.toLocaleString()} />
            <StatCard icon={Clock} label="Avg. session" value={fmtDuration(summary.avgSessionDuration)} />
          </>
        ) : (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        )}
      </div>

      <Panel className="mt-4">
        <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">Visitors per day</p>
        <div className="mt-4 h-[200px]">
          {summary ? (
            <VisitorsAreaChart data={summary.dailyUsers} />
          ) : (
            <div className="h-full animate-pulse rounded-lg bg-white/[0.04]" />
          )}
        </div>
      </Panel>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel>
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">Top pages</p>
          <div className="mt-4 space-y-2">
            {summary?.topPages.map((p) => (
              <div key={p.path} className="flex items-center justify-between text-[13px]">
                <span className="truncate text-white/70">{p.path}</span>
                <span className="shrink-0 pl-3 font-medium text-white/90">{p.views.toLocaleString()}</span>
              </div>
            ))}
            {summary && summary.topPages.length === 0 && (
              <p className="text-[13px] text-white/30">No data yet for this period.</p>
            )}
          </div>
        </Panel>
        <Panel>
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">Traffic sources</p>
          <div className="mt-4 space-y-2">
            {summary?.topSources.map((s) => (
              <div key={s.source} className="flex items-center justify-between text-[13px]">
                <span className="truncate text-white/70">{s.source}</span>
                <span className="shrink-0 pl-3 font-medium text-white/90">{s.sessions.toLocaleString()}</span>
              </div>
            ))}
            {summary && summary.topSources.length === 0 && (
              <p className="text-[13px] text-white/30">No data yet for this period.</p>
            )}
          </div>
        </Panel>
      </div>
    </>
  );
}

export default function AdminAnalyticsPage() {
  const [timeframe, setTimeframe] = useState<Timeframe>("30d");

  return (
    <div>
      <PageHeader eyebrow="Analytics" title="Site traffic" subtitle="Live from Google Analytics 4" />

      <div className="mt-8">
        <SegmentedControl options={TIMEFRAME_OPTIONS} value={timeframe} onChange={setTimeframe} />
      </div>

      <AnalyticsData key={timeframe} timeframe={timeframe} />
    </div>
  );
}
