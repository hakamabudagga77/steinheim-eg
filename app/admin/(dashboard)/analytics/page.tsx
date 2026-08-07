"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Users, Activity, Eye, Clock, UserPlus, MousePointer2, Download } from "lucide-react";
import { PageHeader, Panel, StatCard, StatCardSkeleton, ErrorState, SegmentedControl } from "@/components/admin/ui";
import { flagEmoji } from "../analytics-summary-helpers";
import RealtimePulse from "@/components/admin/RealtimePulse";

// recharts (~120 KB gzip) loads on demand instead of in this page's initial JS.
const VisitorsAreaChart = dynamic(() => import("./AnalyticsChart").then((m) => m.VisitorsAreaChart), {
  ssr: false,
  loading: () => <div className="h-full animate-pulse rounded-lg bg-white/[0.04]" />,
});

type Preset = "7d" | "30d" | "90d" | "custom";

const PRESET_OPTIONS: Array<{ value: Preset; label: string }> = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "custom", label: "Custom" },
];

const PRESET_DAYS: Record<"7d" | "30d" | "90d", number> = { "7d": 7, "30d": 30, "90d": 90 };

const FUNNEL_LABELS: Record<GA4FunnelStage["stage"], string> = {
  sessions: "Sessions",
  view_item: "Viewed a product",
  add_to_cart: "Added to cart",
  begin_checkout: "Began checkout",
  purchase: "Purchased",
};

interface GA4PreviousPeriod {
  activeUsers: number;
  newUsers: number;
  sessions: number;
  pageViews: number;
}

interface GA4FunnelStage {
  stage: "sessions" | "view_item" | "add_to_cart" | "begin_checkout" | "purchase";
  count: number;
}

interface GA4Summary {
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
  topCountries: Array<{ country: string; code: string; users: number }>;
  landingPages: Array<{ path: string; sessions: number }>;
  previousPeriod: GA4PreviousPeriod | null;
  previousDailyUsers: Array<{ users: number; sessions: number }>;
  funnel: GA4FunnelStage[];
  localeSplit: { en: number; ar: number; other: number };
  newVsReturning: { new: number; returning: number };
}

interface DateRange {
  start: string;
  end: string;
}

function fmtDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

// Pure function of a fixed instant, not of the ambient clock -- callers pass
// `asOf` (captured once via an effect) so this stays safe to call from
// useMemo without tripping the render-purity rule.
function presetRangeFromAsOf(asOf: number, preset: "7d" | "30d" | "90d"): DateRange {
  const days = PRESET_DAYS[preset];
  const end = new Date(asOf);
  const start = new Date(asOf);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  return { start: isoDate(start), end: isoDate(end) };
}

function computeTrend(current: number, previous: number | undefined): { direction: "up" | "down" | "flat"; label: string } | undefined {
  if (previous === undefined) return undefined;
  if (previous === 0) return current === 0 ? { direction: "flat", label: "no change" } : { direction: "up", label: "new this period" };
  const pct = ((current - previous) / previous) * 100;
  if (Math.abs(pct) < 0.5) return { direction: "flat", label: "flat vs prior period" };
  return { direction: pct > 0 ? "up" : "down", label: `${Math.abs(pct).toFixed(0)}% vs prior period` };
}

function csvEscape(value: string | number) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function downloadSummaryCsv(summary: GA4Summary, range: DateRange) {
  const lines: string[] = [];
  lines.push(csvEscape(`Steinheim website analytics — ${range.start} to ${range.end}`));
  lines.push("");
  lines.push("Metric,Value");
  lines.push(`Visitors,${summary.activeUsers}`);
  lines.push(`New visitors,${summary.newUsers}`);
  lines.push(`Sessions,${summary.sessions}`);
  lines.push(`Page views,${summary.pageViews}`);
  lines.push(`Engagement rate,${(summary.engagementRate * 100).toFixed(1)}%`);
  lines.push(`Bounce rate,${(summary.bounceRate * 100).toFixed(1)}%`);
  lines.push(`Avg. session,${Math.round(summary.avgSessionDuration)}s`);

  const section = (title: string, header: string, rows: Array<[string | number, string | number]>) => {
    lines.push("");
    lines.push(csvEscape(title));
    lines.push(header);
    rows.forEach(([a, b]) => lines.push(`${csvEscape(a)},${b}`));
  };

  section("Top pages", "Path,Views", summary.topPages.map((p) => [p.path, p.views]));
  section("Traffic sources", "Source,Sessions", summary.topSources.map((s) => [s.source, s.sessions]));
  section("Acquisition channels", "Channel,Sessions", summary.topChannels.map((c) => [c.channel, c.sessions]));
  section("Device mix", "Device,Sessions", summary.devices.map((d) => [d.device, d.sessions]));
  section("Top markets", "Country,Visitors", summary.topCountries.map((c) => [c.code ? `${c.country} (${c.code})` : c.country, c.users]));
  section("Landing pages", "Path,Sessions", summary.landingPages.map((p) => [p.path, p.sessions]));
  section("Conversion funnel", "Stage,Count", summary.funnel.map((f) => [FUNNEL_LABELS[f.stage], f.count]));
  section("Traffic by language", "Language,Sessions", [
    ["English", summary.localeSplit.en],
    ["Arabic", summary.localeSplit.ar],
    ["Other", summary.localeSplit.other],
  ]);
  section("New vs returning", "Type,Sessions", [
    ["New", summary.newVsReturning.new],
    ["Returning", summary.newVsReturning.returning],
  ]);

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `steinheim-analytics-${range.start}-to-${range.end}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function FunnelPanel({ funnel }: { funnel: GA4FunnelStage[] }) {
  const top = funnel[0]?.count ?? 0;
  return (
    <Panel className="mt-4">
      <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">Conversion funnel</p>
      <div className="mt-4 space-y-3">
        {top === 0 && <p className="text-[13px] text-white/30">No data yet for this period.</p>}
        {funnel.map((stage, i) => {
          const pctOfTop = top > 0 ? (stage.count / top) * 100 : 0;
          const prev = funnel[i - 1];
          const dropOff = i > 0 && prev && prev.count > 0 ? 100 - (stage.count / prev.count) * 100 : null;
          return (
            <div key={stage.stage}>
              <div className="flex items-center justify-between gap-3 text-[12px]">
                <span className="text-white/65">{FUNNEL_LABELS[stage.stage]}</span>
                <span className="text-white/85">
                  {stage.count.toLocaleString()}
                  {i > 0 && <span className="ml-2 text-white/30">{pctOfTop.toFixed(1)}% of sessions</span>}
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                <div className="h-full rounded-full bg-[#0a84ff]" style={{ width: `${Math.max(top > 0 ? 2 : 0, pctOfTop)}%` }} />
              </div>
              {dropOff !== null && dropOff > 0.5 && <p className="mt-1 text-[10px] text-white/30">−{dropOff.toFixed(0)}% from the previous step</p>}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function AnalyticsData({ range }: { range: DateRange }) {
  const [summary, setSummary] = useState<GA4Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/analytics?start=${range.start}&end=${range.end}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Could not load analytics.");
        }
        return res.json();
      })
      .then((data) => setSummary(data.summary))
      .catch((err) => setError(err.message));
  }, [range.start, range.end]);

  // Merged by day-index (not calendar date) so "day 3 of this period" lines
  // up with "day 3 of last period" on the same X position. Computed above
  // the error early-return -- hooks must run unconditionally every render.
  const chartData = useMemo(
    () =>
      summary?.dailyUsers.map((day, i) => ({
        date: day.date,
        users: day.users,
        sessions: day.sessions,
        prevUsers: summary.previousDailyUsers[i]?.users,
        prevSessions: summary.previousDailyUsers[i]?.sessions,
      })) ?? [],
    [summary]
  );

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

  const prev = summary?.previousPeriod ?? undefined;

  return (
    <>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {summary ? (
          <>
            <StatCard icon={Users} label="Visitors" value={summary.activeUsers.toLocaleString()} accent trend={computeTrend(summary.activeUsers, prev?.activeUsers)} />
            <StatCard icon={UserPlus} label="New visitors" value={summary.newUsers.toLocaleString()} trend={computeTrend(summary.newUsers, prev?.newUsers)} />
            <StatCard icon={Activity} label="Sessions" value={summary.sessions.toLocaleString()} trend={computeTrend(summary.sessions, prev?.sessions)} />
            <StatCard icon={Eye} label="Page views" value={summary.pageViews.toLocaleString()} trend={computeTrend(summary.pageViews, prev?.pageViews)} />
            <StatCard icon={MousePointer2} label="Engagement" value={`${Math.round(summary.engagementRate * 100)}%`} />
            <StatCard icon={Clock} label="Avg. session" value={fmtDuration(summary.avgSessionDuration)} />
          </>
        ) : (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        )}
      </div>

      <Panel className="mt-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">Visitors and sessions</p>
            {summary && summary.previousDailyUsers.length > 0 && (
              <span className="text-[10px] text-white/25">(dashed = previous period)</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <p className="text-[11px] text-white/30">{summary ? `${summary.pagesPerSession.toFixed(1)} pages / session · ${Math.round(summary.bounceRate * 100)}% bounce` : ""}</p>
            {summary && (
              <button
                type="button"
                onClick={() => downloadSummaryCsv(summary, range)}
                className="flex h-7 items-center gap-1.5 rounded-full border border-white/10 px-3 text-[11px] text-white/55 transition hover:border-white/25 hover:text-white"
              >
                <Download className="h-3 w-3" /> Export CSV
              </button>
            )}
          </div>
        </div>
        <div className="mt-4 h-[200px]">
          {summary ? (
            <VisitorsAreaChart data={chartData} />
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
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel><MetricList title="Acquisition channels" items={summary?.topChannels.map((item) => ({ label: item.channel, value: item.sessions }))} /></Panel>
        <Panel><MetricList title="Device mix" items={summary?.devices.map((item) => ({ label: item.device, value: item.sessions }))} /></Panel>
        <Panel>
          <MetricList
            title="Top markets"
            items={summary?.topCountries.map((item) => ({ label: [flagEmoji(item.code), item.country].filter(Boolean).join(" "), value: item.users }))}
          />
        </Panel>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel><MetricList title="Landing pages" items={summary?.landingPages.map((item) => ({ label: item.path, value: item.sessions }))} /></Panel>
        <Panel>
          <MetricList
            title="Traffic by language"
            items={
              summary
                ? [
                    { label: "English", value: summary.localeSplit.en },
                    { label: "Arabic", value: summary.localeSplit.ar },
                    { label: "Other", value: summary.localeSplit.other },
                  ]
                : undefined
            }
          />
        </Panel>
        <Panel>
          <MetricList
            title="New vs returning"
            items={
              summary
                ? [
                    { label: "New", value: summary.newVsReturning.new },
                    { label: "Returning", value: summary.newVsReturning.returning },
                  ]
                : undefined
            }
          />
        </Panel>
      </div>
      {summary && <FunnelPanel funnel={summary.funnel} />}
    </>
  );
}

export default function AdminAnalyticsPage() {
  const [preset, setPreset] = useState<Preset>("30d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [asOf, setAsOf] = useState<number | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAsOf(Date.now());
  }, []);

  const range = useMemo<DateRange | null>(() => {
    if (preset === "custom") {
      if (customStart && customEnd && customStart <= customEnd) return { start: customStart, end: customEnd };
      return null;
    }
    if (asOf === null) return null;
    return presetRangeFromAsOf(asOf, preset);
  }, [preset, customStart, customEnd, asOf]);

  return (
    <div>
      <PageHeader eyebrow="Website Analytics · GA4" title="Digital performance" subtitle="The customer journey across the Steinheim website" />

      <div className="mt-8">
        <RealtimePulse variant="full" />
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <SegmentedControl options={PRESET_OPTIONS} value={preset} onChange={setPreset} />
        {preset === "custom" && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customStart}
              max={customEnd || undefined}
              onChange={(e) => setCustomStart(e.target.value)}
              className="h-9 rounded-lg border border-white/10 bg-black/30 px-3 text-[13px] text-white outline-none focus:border-[#0a84ff]"
              aria-label="Start date"
            />
            <span className="text-[12px] text-white/30">to</span>
            <input
              type="date"
              value={customEnd}
              min={customStart || undefined}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="h-9 rounded-lg border border-white/10 bg-black/30 px-3 text-[13px] text-white outline-none focus:border-[#0a84ff]"
              aria-label="End date"
            />
          </div>
        )}
      </div>

      {range ? (
        <AnalyticsData key={`${range.start}:${range.end}`} range={range} />
      ) : (
        <p className="mt-8 text-[13px] text-white/35">Pick a start and end date.</p>
      )}
    </div>
  );
}

function MetricList({ title, items }: { title: string; items?: Array<{ label: string; value: number }> }) {
  const max = Math.max(...(items?.map((item) => item.value) ?? [1]), 1);
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">{title}</p>
      <div className="mt-4 space-y-3">
        {items?.map((item) => <div key={item.label}><div className="flex justify-between gap-3 text-[12px]"><span className="truncate capitalize text-white/65">{item.label}</span><span className="text-white/85">{item.value.toLocaleString()}</span></div><div className="mt-1 h-1 overflow-hidden rounded-full bg-white/[0.05]"><div className="h-full rounded-full bg-[#0a84ff]" style={{ width: `${Math.max(4, item.value / max * 100)}%` }} /></div></div>)}
        {items && items.length === 0 && <p className="text-[13px] text-white/30">No data yet for this period.</p>}
      </div>
    </div>
  );
}
