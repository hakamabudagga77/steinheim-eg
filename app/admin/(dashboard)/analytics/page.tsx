"use client";

import { useEffect, useMemo, useState } from "react";

type Timeframe = "7d" | "30d" | "90d";

const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  "7d": "7 days",
  "30d": "30 days",
  "90d": "90 days",
};

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

  const maxDailyUsers = useMemo(
    () => Math.max(1, ...(summary?.dailyUsers.map((d) => d.users) ?? [1])),
    [summary]
  );

  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.3em] text-black/40">Analytics</p>
      <h1 className="mt-2 font-heading text-[32px] tracking-[-0.02em]">Site traffic</h1>
      <p className="mt-2 text-[13px] text-black/40">Live from Google Analytics 4</p>

      {error && (
        <div className="mt-6 rounded-xl border border-black/8 bg-white p-6">
          <p className="text-[14px] text-black/60">{error}</p>
          {error.includes("not configured") && (
            <p className="mt-2 text-[13px] text-black/40">
              Needs <code className="rounded bg-black/5 px-1.5 py-0.5">GA4_PROPERTY_ID</code> set in the environment.
            </p>
          )}
        </div>
      )}

      {!error && (
        <>
          <div className="mt-8 flex flex-wrap items-center gap-2">
            {(["7d", "30d", "90d"] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={`rounded-full border px-4 py-1.5 text-[12px] transition ${
                  timeframe === tf ? "border-black bg-black text-white" : "border-black/15 text-black/55 hover:border-black/30"
                }`}
              >
                {TIMEFRAME_LABELS[tf]}
              </button>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-black/8 bg-white p-6">
              <p className="text-[11px] uppercase tracking-[0.2em] text-black/40">Visitors</p>
              <p className="mt-2 text-[26px] font-medium">{summary ? summary.activeUsers.toLocaleString() : "—"}</p>
            </div>
            <div className="rounded-xl border border-black/8 bg-white p-6">
              <p className="text-[11px] uppercase tracking-[0.2em] text-black/40">Sessions</p>
              <p className="mt-2 text-[26px] font-medium">{summary ? summary.sessions.toLocaleString() : "—"}</p>
            </div>
            <div className="rounded-xl border border-black/8 bg-white p-6">
              <p className="text-[11px] uppercase tracking-[0.2em] text-black/40">Page views</p>
              <p className="mt-2 text-[26px] font-medium">{summary ? summary.pageViews.toLocaleString() : "—"}</p>
            </div>
            <div className="rounded-xl border border-black/8 bg-white p-6">
              <p className="text-[11px] uppercase tracking-[0.2em] text-black/40">Avg. session</p>
              <p className="mt-2 text-[26px] font-medium">{summary ? fmtDuration(summary.avgSessionDuration) : "—"}</p>
            </div>
          </div>

          {summary && summary.dailyUsers.length > 0 && (
            <div className="mt-4 rounded-xl border border-black/8 bg-white p-6">
              <p className="text-[11px] uppercase tracking-[0.2em] text-black/40">Visitors per day</p>
              <div className="mt-4 flex h-32 items-end gap-1">
                {summary.dailyUsers.map((d) => (
                  <div key={d.date} className="group relative flex-1">
                    <div
                      className="w-full rounded-t bg-black/80 transition group-hover:bg-black"
                      style={{ height: `${Math.max(4, (d.users / maxDailyUsers) * 100)}%` }}
                    />
                    <div className="pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap rounded bg-black px-2 py-1 text-[10px] text-white opacity-0 transition group-hover:opacity-100">
                      {fmtDate(d.date)}: {d.users}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-black/8 bg-white p-6">
              <p className="text-[11px] uppercase tracking-[0.2em] text-black/40">Top pages</p>
              <div className="mt-4 space-y-2">
                {summary?.topPages.map((p) => (
                  <div key={p.path} className="flex items-center justify-between text-[13px]">
                    <span className="truncate text-black/70">{p.path}</span>
                    <span className="shrink-0 pl-3 font-medium">{p.views.toLocaleString()}</span>
                  </div>
                ))}
                {summary && summary.topPages.length === 0 && (
                  <p className="text-[13px] text-black/40">No data yet for this period.</p>
                )}
              </div>
            </div>
            <div className="rounded-xl border border-black/8 bg-white p-6">
              <p className="text-[11px] uppercase tracking-[0.2em] text-black/40">Traffic sources</p>
              <div className="mt-4 space-y-2">
                {summary?.topSources.map((s) => (
                  <div key={s.source} className="flex items-center justify-between text-[13px]">
                    <span className="truncate text-black/70">{s.source}</span>
                    <span className="shrink-0 pl-3 font-medium">{s.sessions.toLocaleString()}</span>
                  </div>
                ))}
                {summary && summary.topSources.length === 0 && (
                  <p className="text-[13px] text-black/40">No data yet for this period.</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
