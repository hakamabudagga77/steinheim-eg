"use client";

import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from "recharts";

// Split out so recharts (~120 KB gzip) loads on demand via next/dynamic
// instead of in the analytics page's initial bundle. JSX is verbatim from the
// page; fmtDate moved here since it was only used by this chart.
function fmtDate(yyyymmdd: string) {
  if (yyyymmdd.length !== 8) return yyyymmdd;
  const d = new Date(`${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function VisitorsAreaChart({ data }: { data: { date: string; users: number; sessions: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
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
          interval={Math.max(0, Math.floor(data.length / 8))}
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
        <Area type="monotone" dataKey="sessions" stroke="#a78bfa" strokeWidth={1.5} fill="transparent" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
