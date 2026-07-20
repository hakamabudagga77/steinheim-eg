"use client";

import { useEffect, useMemo, useState } from "react";
import { TrendingUp, ShoppingBag, Percent, Repeat } from "lucide-react";
import { PageHeader, Panel, StatCard, StatCardSkeleton, Badge, SegmentedControl, type BadgeTone } from "@/components/admin/ui";
import { ChannelIcon } from "@/components/admin/ChannelIcon";
import { classifyOrderChannel, type ChannelPlatform, type ChannelType } from "@/lib/channel-attribution";
import type { ShopifyOrder, ShopifyCustomer } from "@/lib/shopify-client";

type Timeframe = "7d" | "30d" | "90d";

const TIMEFRAME_OPTIONS: Array<{ value: Timeframe; label: string }> = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
];

const TIMEFRAME_DAY_COUNT: Record<Timeframe, number> = { "7d": 7, "30d": 30, "90d": 90 };

const TYPE_TONE: Record<ChannelType, BadgeTone> = {
  Paid: "accent",
  Organic: "positive",
  Direct: "neutral",
};

interface ChannelRow {
  key: string;
  platform: ChannelPlatform;
  type: ChannelType;
  revenue: number;
  count: number;
  newCount: number;
  returningCount: number;
}

export default function MarketingAnalyticsPage() {
  const [timeframe, setTimeframe] = useState<Timeframe>("30d");
  const [orders, setOrders] = useState<ShopifyOrder[] | null>(null);
  const [customers, setCustomers] = useState<ShopifyCustomer[] | null>(null);
  const [asOf, setAsOf] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/admin/orders")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setOrders(d.orders);
          setAsOf(Date.now());
        }
      })
      .catch(() => {});
    fetch("/api/admin/customers?limit=250")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setCustomers(d.customers))
      .catch(() => {});
  }, []);

  const returningCustomerIds = useMemo(() => {
    if (!customers) return null;
    return new Set(customers.filter((c) => c.orders_count > 1).map((c) => c.id));
  }, [customers]);

  const report = useMemo(() => {
    if (!orders || !returningCustomerIds || asOf === null) return null;
    const cutoff = asOf - TIMEFRAME_DAY_COUNT[timeframe] * 86400000;
    const inRange = orders.filter((o) => new Date(o.created_at).getTime() >= cutoff && o.financial_status !== "voided");

    const byChannel = new Map<string, ChannelRow>();
    for (const order of inRange) {
      const info = classifyOrderChannel(order);
      const entry = byChannel.get(info.key) ?? {
        key: info.key,
        platform: info.platform,
        type: info.type,
        revenue: 0,
        count: 0,
        newCount: 0,
        returningCount: 0,
      };
      entry.revenue += Number(order.total_price || 0);
      entry.count += 1;
      const isReturning = order.customer ? returningCustomerIds.has(order.customer.id) : false;
      if (isReturning) entry.returningCount += 1;
      else entry.newCount += 1;
      byChannel.set(info.key, entry);
    }

    const rows = Array.from(byChannel.values()).sort((a, b) => b.revenue - a.revenue);
    const currency = inRange[0]?.currency ?? "EGP";
    const totalRevenue = rows.reduce((sum, r) => sum + r.revenue, 0);
    const totalOrders = rows.reduce((sum, r) => sum + r.count, 0);
    const paidRevenue = rows.filter((r) => r.type === "Paid").reduce((sum, r) => sum + r.revenue, 0);
    const returningOrders = rows.reduce((sum, r) => sum + r.returningCount, 0);

    return {
      currency,
      rows,
      totalRevenue,
      totalOrders,
      aov: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      paidSharePct: totalRevenue > 0 ? (paidRevenue / totalRevenue) * 100 : 0,
      returningSharePct: totalOrders > 0 ? (returningOrders / totalOrders) * 100 : 0,
    };
  }, [orders, returningCustomerIds, timeframe, asOf]);

  return (
    <div>
      <PageHeader
        eyebrow="Marketing Analytics · Shopify"
        title="Where sales come from"
        subtitle="Real order-level attribution — which channel actually closed the sale, not just visited"
      />

      <div className="mt-8">
        <SegmentedControl options={TIMEFRAME_OPTIONS} value={timeframe} onChange={setTimeframe} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {report ? (
          <>
            <StatCard
              icon={TrendingUp}
              label="Total sales"
              value={`${report.currency} ${report.totalRevenue.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
              accent
            />
            <StatCard icon={ShoppingBag} label="Orders" value={report.totalOrders.toLocaleString()} hint={`${report.currency} ${report.aov.toLocaleString("en-US", { maximumFractionDigits: 0 })} AOV`} />
            <StatCard icon={Percent} label="Paid share" value={`${Math.round(report.paidSharePct)}%`} hint="of revenue from paid channels" />
            <StatCard icon={Repeat} label="Returning" value={`${Math.round(report.returningSharePct)}%`} hint="of orders from repeat customers" />
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
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">Sales by channel</p>
          <p className="mt-1 text-[11px] text-white/25">
            Built from Shopify&apos;s own order-level UTM and referrer data. Ad spend, click, and session metrics need Meta/Google Ads
            accounts connected in Shopify — this shows revenue attribution only.
          </p>
        </div>
        <div className="mt-5 divide-y divide-white/[0.05]">
          {report?.rows.map((row) => {
            const max = Math.max(...report.rows.map((r) => r.revenue), 1);
            const aov = row.count > 0 ? row.revenue / row.count : 0;
            return (
              <div key={row.key} className="flex flex-col gap-2 py-3.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:gap-3.5">
                <div className="flex items-center gap-3.5">
                  <ChannelIcon platform={row.platform} />
                  <div className="min-w-0 flex-1 sm:hidden">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[13.5px] text-white/85">{row.key.replace(/\s*\((Paid|Organic|Direct)\)$/, "")}</span>
                      <Badge tone={TYPE_TONE[row.type]}>{row.type}</Badge>
                    </div>
                  </div>
                </div>
                <div className="hidden min-w-0 flex-1 sm:block">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[13.5px] text-white/85">{row.key.replace(/\s*\((Paid|Organic|Direct)\)$/, "")}</span>
                    <Badge tone={TYPE_TONE[row.type]}>{row.type}</Badge>
                  </div>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/[0.05]">
                    <div className="h-full rounded-full bg-[#0a84ff]" style={{ width: `${Math.max(4, (row.revenue / max) * 100)}%` }} />
                  </div>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-white/[0.05] sm:hidden">
                  <div className="h-full rounded-full bg-[#0a84ff]" style={{ width: `${Math.max(4, (row.revenue / max) * 100)}%` }} />
                </div>
                <div className="shrink-0 text-left sm:text-right">
                  <p className="text-[14px] font-medium tabular-nums text-white/90">
                    {report.currency} {row.revenue.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                  </p>
                  <p className="mt-0.5 text-[11px] text-white/35">
                    {row.count} order{row.count === 1 ? "" : "s"} · {report.currency} {aov.toLocaleString("en-US", { maximumFractionDigits: 0 })} AOV
                  </p>
                  <p className="mt-0.5 text-[10.5px] text-white/25">
                    {row.newCount} new · {row.returningCount} returning
                  </p>
                </div>
              </div>
            );
          })}
          {report && report.rows.length === 0 && <p className="text-[13px] text-white/30">No orders in this period.</p>}
          {!report && (
            <div className="space-y-3">
              <div className="h-14 animate-pulse rounded-lg bg-white/[0.04]" />
              <div className="h-14 animate-pulse rounded-lg bg-white/[0.04]" />
              <div className="h-14 animate-pulse rounded-lg bg-white/[0.04]" />
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}
