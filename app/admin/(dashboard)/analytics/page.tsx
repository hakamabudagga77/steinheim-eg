"use client";

import { useEffect, useState } from "react";
import { Users, Activity, Eye, Clock } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { PageHeader, Panel, StatCard, StatCardSkeleton, ErrorState, SegmentedControl } from "@/components/admin/ui";

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

function fmtDate(yyyymmdd: string) {
  if (yyyymmdd.length !== 8) return yyyymmdd;
  const d = new Date(`${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function AdminAnalyticsPage() {
  const [summary, setSummary] = useState<GA4Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>("30d");

  useEffect(() => {
    setSummary(null);
    setError(null);
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

  return (
    <div>
      <PageHeader eyebrow="Analytics" title="Site traffic" subtitle="Live from Google Analytics 4" />

      {error && (
        <ErrorState>
          {error}
          {error.includes("not configured") && (
            <span className="mt-2 block text-white/40">
              Needs <code className="rounded bg-white/[0.08] px-1.5 py-0.5">GA4_PROPERTY_ID</code> set in the environment.
            </span>
          )}
        </ErrorState>
      )}

      {!error && (
        <>
          <div className="mt-8">
            <SegmentedControl options={TIMEFRAME_OPTIONS} value={timeframe} onChange={setTimeframe} />
          </div>

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
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={summary.dailyUsers} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                    <defs>
                      <linearGradient id="visitorsFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#60a5fa" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      tickFormatter={fmtDate}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
                      interval={Math.max(0, Math.floor(summary.dailyUsers.length / 8))}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#18181b",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 10,
                        fontSize: 12,
                        color: "#fff",
                      }}
                      labelFormatter={(v) => fmtDate(String(v))}
                      labelStyle={{ color: "rgba(255,255,255,0.5)" }}
                    />
                    <Area type="monotone" dataKey="users" stroke="#60a5fa" strokeWidth={2} fill="url(#visitorsFill)" />
                  </AreaChart>
                </ResponsiveContainer>
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
      )}
    </div>
  );
}
