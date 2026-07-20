"use client";

import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from "recharts";

// Split out so recharts (~120 KB gzip) loads on demand via next/dynamic
// instead of in the orders page's initial bundle. JSX is verbatim from the
// page; the data array and currency label are props.
export function RevenueTrendChart({
  data,
  currency,
}: {
  data: { date: string; revenue: number }[];
  currency: string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
        <defs>
          <linearGradient id="ordersRevenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c9a961" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#c9a961" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
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
          labelStyle={{ color: "rgba(255,255,255,0.5)" }}
          formatter={(v) => [
            `${currency} ${Number(v).toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
            "Revenue",
          ]}
        />
        <Area type="monotone" dataKey="revenue" stroke="#c9a961" strokeWidth={2} fill="url(#ordersRevenueFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
