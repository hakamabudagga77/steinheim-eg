"use client";

import { AreaChart, Area, LineChart, Line, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { fmtDate, type GA4Summary } from "./analytics-summary-helpers";

// The recharts-backed charts for the admin dashboard, split into their own
// module so recharts (~120 KB gzip with its victory-vendor/decimal.js-light
// deps) loads on demand via next/dynamic instead of in the dashboard page's
// initial bundle. JSX is verbatim from the page — only the data source is a
// prop now.

export function RevenueChart({ data }: { data: { date: string; revenue: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c9a961" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#c9a961" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
          interval={2}
        />
        <Tooltip
          contentStyle={{
            background: "#18181b",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10,
            fontSize: 12,
            color: "#fff",
          }}
          labelStyle={{ color: "rgba(255,255,255,0.5)" }}
          formatter={(v) => [Number(v).toLocaleString("en-US", { maximumFractionDigits: 0 }), "Revenue"]}
        />
        <Area type="monotone" dataKey="revenue" stroke="#c9a961" strokeWidth={2} fill="url(#revenueFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function VisitorsChart({ data }: { data: GA4Summary["dailyUsers"] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
        <XAxis dataKey="date" hide />
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
        <Line type="monotone" dataKey="users" stroke="#60a5fa" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
