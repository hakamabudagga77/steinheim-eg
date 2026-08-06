"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { Marker } from "cobe";
import { Panel } from "@/components/admin/ui";
import { flagEmoji } from "@/app/admin/(dashboard)/analytics-summary-helpers";
import { countryCentroid } from "@/lib/country-centroids";

// cobe renders to a WebGL canvas -- keep it out of the server bundle and
// out of every admin page's initial JS, since only the Analytics page's
// full realtime panel needs it.
const LiveGlobe = dynamic(() => import("./LiveGlobe"), {
  ssr: false,
  loading: () => <div className="mx-auto aspect-square w-full max-w-[280px] animate-pulse rounded-full bg-white/[0.04]" />,
});

interface GA4Realtime {
  activeUsers: number;
  byCountry: Array<{ country: string; code: string; users: number }>;
  byDevice: Array<{ device: string; users: number }>;
  nowViewing: Array<{ page: string; users: number }>;
}

const POLL_MS = 30_000;

function useRealtime() {
  const [data, setData] = useState<GA4Realtime | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    function load() {
      fetch("/api/admin/analytics/realtime")
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((d) => {
          if (!cancelled) {
            setData(d.realtime);
            setError(false);
          }
        })
        .catch(() => {
          if (!cancelled) setError(true);
        });
    }

    load();
    const interval = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return { data, error };
}

// Small pulsing dot -- CSS-only, no extra dependency. Green while we have a
// live reading, dim grey once GA4 reports nobody's on the site right now.
function PulseDot({ live }: { live: boolean }) {
  return (
    <span className="relative flex h-2 w-2">
      {live && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />}
      <span className={`relative inline-flex h-2 w-2 rounded-full ${live ? "bg-emerald-400" : "bg-white/25"}`} />
    </span>
  );
}

// Marker size scales with visitor count but stays in a tight range -- at
// our traffic level most countries are 1-3 users, and an unbounded scale
// would make a single busy country swallow the globe.
function markerSize(users: number) {
  return Math.min(0.04 + users * 0.018, 0.14);
}

/**
 * "Right now" GA4 realtime widget. `variant="compact"` is a one-line stat
 * for the Overview page; `variant="full"` is the panel on the Analytics
 * page with the globe, country/device breakdown, and "now viewing" list.
 * Both poll independently -- the 10s server-side dedupe in
 * fetchGA4Realtime keeps that from doubling the GA4 API call rate when an
 * admin has both pages open.
 */
export default function RealtimePulse({ variant }: { variant: "compact" | "full" }) {
  const { data, error } = useRealtime();

  const markers = useMemo<Marker[]>(() => {
    if (!data) return [];
    return data.byCountry
      .map((c) => {
        const centroid = countryCentroid(c.code);
        if (!centroid) return null;
        return { location: centroid, size: markerSize(c.users) } satisfies Marker;
      })
      .filter((m): m is Marker => m !== null);
  }, [data]);

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-2.5 rounded-full border border-white/[0.08] bg-white/[0.02] px-3.5 py-1.5">
        <PulseDot live={!!data && data.activeUsers > 0} />
        <span className="text-[12.5px] text-white/70">
          {error ? (
            <span className="text-white/30">Live visitors unavailable</span>
          ) : data ? (
            <>
              <span className="font-semibold tabular-nums text-white">{data.activeUsers}</span>{" "}
              {data.activeUsers === 1 ? "person" : "people"} on site right now
            </>
          ) : (
            <span className="text-white/30">Checking who&apos;s here…</span>
          )}
        </span>
      </div>
    );
  }

  return (
    <Panel>
      {error ? (
        <p className="text-[13px] text-white/35">Live visitor data unavailable right now.</p>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[200px_280px_minmax(0,1fr)]">
          {/* The globe column is a fixed 280px, not minmax-down-to-0 -- with
              three flex-wrap sub-lists in the third column (each carrying
              their own min-width), a flexible middle track was losing the
              space race to the list column's min-content and rendering the
              globe as a ~150px thumbnail instead of full size. */}
          <div className="flex items-center gap-3 lg:flex-col lg:items-start lg:justify-center">
            <PulseDot live={!!data && data.activeUsers > 0} />
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">Right now</p>
              <p className="mt-1 font-heading text-[36px] leading-none tabular-nums tracking-[-0.02em] text-white">
                {data ? data.activeUsers : "—"}
              </p>
              <p className="mt-1 text-[11.5px] text-white/30">{data ? "active on the site" : "loading…"}</p>
            </div>
          </div>

          {data && data.activeUsers > 0 && markers.length > 0 && <LiveGlobe markers={markers} />}

          {data && data.activeUsers > 0 && (
            <div className="flex min-w-0 flex-wrap gap-x-8 gap-y-4 border-t border-white/[0.06] pt-4 lg:border-t-0 lg:border-l lg:pl-8 lg:pt-0">
              {data.byCountry.length > 0 && (
                <div className="min-w-[140px]">
                  <p className="text-[10.5px] uppercase tracking-[0.2em] text-white/25">By country</p>
                  <ul className="mt-2 space-y-1">
                    {data.byCountry.slice(0, 5).map((c) => (
                      <li key={c.country} className="flex items-center justify-between gap-4 text-[12.5px] text-white/65">
                        <span className="truncate">{[flagEmoji(c.code), c.country].filter(Boolean).join(" ")}</span>
                        <span className="tabular-nums text-white/40">{c.users}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {data.byDevice.length > 0 && (
                <div className="min-w-[120px]">
                  <p className="text-[10.5px] uppercase tracking-[0.2em] text-white/25">By device</p>
                  <ul className="mt-2 space-y-1">
                    {data.byDevice.map((d) => (
                      <li key={d.device} className="flex items-center justify-between gap-4 text-[12.5px] text-white/65">
                        <span className="truncate capitalize">{d.device}</span>
                        <span className="tabular-nums text-white/40">{d.users}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {data.nowViewing.length > 0 && (
                <div className="min-w-[180px] flex-1">
                  <p className="text-[10.5px] uppercase tracking-[0.2em] text-white/25">Now viewing</p>
                  <ul className="mt-2 space-y-1">
                    {data.nowViewing.map((p) => (
                      <li key={p.page} className="flex items-center justify-between gap-4 text-[12.5px] text-white/65">
                        <span className="truncate">{p.page}</span>
                        <span className="tabular-nums text-white/40">{p.users}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}
