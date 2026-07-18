"use client";

import { useEffect, useMemo, useState } from "react";
import { Wallet, ShoppingBag, TrendingUp, Truck, X } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import type { ShopifyOrder } from "@/lib/shopify-client";
import { PageHeader, Panel, StatCard, StatCardSkeleton, Badge, EmptyState, ErrorState, SegmentedControl } from "@/components/admin/ui";

function FulfillModal({
  order,
  onClose,
  onFulfilled,
}: {
  order: ShopifyOrder;
  onClose: () => void;
  onFulfilled: () => void;
}) {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingCompany, setTrackingCompany] = useState("");
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const summary = [
      trackingNumber && `tracking number ${trackingNumber}`,
      trackingCompany && `via ${trackingCompany}`,
    ]
      .filter(Boolean)
      .join(" ");
    const confirmed = window.confirm(
      `Mark ${order.name} as fulfilled${summary ? ` (${summary})` : ""}?${
        notifyCustomer ? " The customer will be emailed." : " The customer will NOT be notified."
      } This updates the live Shopify store immediately and cannot be undone from here.`
    );
    if (!confirmed) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/fulfill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingNumber, trackingCompany, notifyCustomer }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not fulfill this order.");
      }
      onFulfilled();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#131316] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <p className="text-[15px] font-medium text-white">Mark {order.name} fulfilled</p>
          <button type="button" onClick={onClose} className="text-white/40 hover:text-white/80">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-3">
          <div>
            <label className="mb-1.5 block text-[11px] uppercase tracking-[0.15em] text-white/35">Tracking number</label>
            <input
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-[13px] text-white outline-none focus:border-[#c9a961]"
              placeholder="Optional"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] uppercase tracking-[0.15em] text-white/35">Carrier</label>
            <input
              value={trackingCompany}
              onChange={(e) => setTrackingCompany(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-[13px] text-white outline-none focus:border-[#c9a961]"
              placeholder="Optional, e.g. Bosta, Aramex"
            />
          </div>
          <label className="flex items-center gap-2 text-[13px] text-white/60">
            <input
              type="checkbox"
              checked={notifyCustomer}
              onChange={(e) => setNotifyCustomer(e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-black/30 accent-[#c9a961]"
            />
            Email the customer
          </label>
        </div>

        {error && <p className="mt-4 text-[13px] text-red-400">{error}</p>}

        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="mt-6 flex h-11 w-full items-center justify-center rounded-full bg-[#c9a961] text-[13px] font-medium text-black transition hover:bg-[#d8bb7a] disabled:opacity-50"
        >
          {saving ? "Saving…" : "Confirm fulfillment"}
        </button>
      </div>
    </div>
  );
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

function statusTone(status: string | null): "accent" | "neutral" | "muted" {
  if (status === "paid" || status === "fulfilled") return "accent";
  if (status === "refunded" || status === "cancelled" || status === "voided") return "muted";
  return "neutral";
}

type Timeframe = "today" | "7d" | "30d" | "all" | "custom";

const TIMEFRAME_OPTIONS: Array<{ value: Timeframe; label: string }> = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "all", label: "All time" },
  { value: "custom", label: "Custom" },
];

function startOfDay(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<ShopifyOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>("30d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [fulfillingOrder, setFulfillingOrder] = useState<ShopifyOrder | null>(null);

  useEffect(() => {
    fetch("/api/admin/orders")
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Could not load orders.");
        }
        return res.json();
      })
      .then((data) => setOrders(data.orders))
      .catch((err) => setError(err.message));
  }, []);

  const range = useMemo(() => {
    let start: Date;
    let end = new Date();
    if (timeframe === "today") {
      start = startOfDay(new Date());
    } else if (timeframe === "7d") {
      start = startOfDay(new Date());
      start.setDate(start.getDate() - 6);
    } else if (timeframe === "30d") {
      start = startOfDay(new Date());
      start.setDate(start.getDate() - 29);
    } else if (timeframe === "custom" && customStart && customEnd) {
      start = startOfDay(new Date(customStart));
      end = new Date(customEnd);
      end.setHours(23, 59, 59, 999);
    } else {
      start = new Date(0);
    }
    return { start, end };
  }, [timeframe, customStart, customEnd]);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    if (timeframe === "all") return orders;
    if (timeframe === "custom" && (!customStart || !customEnd)) return orders;
    return orders.filter((o) => {
      const created = new Date(o.created_at);
      return created >= range.start && created <= range.end;
    });
  }, [orders, timeframe, range, customStart, customEnd]);

  const summary = useMemo(() => {
    const counted = filteredOrders.filter((o) => o.financial_status !== "voided");
    const revenue = counted.reduce((sum, o) => sum + Number(o.total_price || 0), 0);
    const currency = filteredOrders[0]?.currency ?? "EGP";
    return {
      revenue,
      currency,
      count: filteredOrders.length,
      avg: counted.length ? revenue / counted.length : 0,
    };
  }, [filteredOrders]);

  const trend = useMemo(() => {
    if (!orders) return [];
    const spanDays =
      timeframe === "today"
        ? 1
        : timeframe === "7d"
          ? 7
          : timeframe === "30d"
            ? 30
            : timeframe === "custom" && customStart && customEnd
              ? Math.max(1, Math.round((range.end.getTime() - range.start.getTime()) / 86400000) + 1)
              : 30;
    const days: { date: string; revenue: number }[] = [];
    for (let i = spanDays - 1; i >= 0; i--) {
      const d = new Date(timeframe === "custom" ? range.end : new Date());
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      const dayRevenue = orders
        .filter((o) => {
          const created = new Date(o.created_at).getTime();
          return created >= d.getTime() && created < next.getTime() && o.financial_status !== "voided";
        })
        .reduce((sum, o) => sum + Number(o.total_price || 0), 0);
      days.push({ date: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }), revenue: dayRevenue });
    }
    return days;
  }, [orders, timeframe, range, customStart, customEnd]);

  return (
    <div>
      <PageHeader
        eyebrow="Orders"
        title={orders ? `${orders.length} order${orders.length === 1 ? "" : "s"}` : "Loading…"}
        subtitle="Live from Shopify · fulfill orders directly from here"
      />

      {error && <ErrorState>{error}</ErrorState>}

      {orders && (
        <>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <SegmentedControl options={TIMEFRAME_OPTIONS} value={timeframe} onChange={setTimeframe} />
            {timeframe === "custom" && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="rounded-full border border-white/15 bg-transparent px-3 py-1.5 text-[12px] text-white/80 [color-scheme:dark]"
                />
                <span className="text-white/30">to</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="rounded-full border border-white/15 bg-transparent px-3 py-1.5 text-[12px] text-white/80 [color-scheme:dark]"
                />
              </div>
            )}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              icon={Wallet}
              label="Revenue"
              value={`${summary.currency} ${summary.revenue.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
              hint="Gross, excludes voided"
              accent
            />
            <StatCard icon={ShoppingBag} label="Orders" value={summary.count} />
            <StatCard
              icon={TrendingUp}
              label="Average order value"
              value={`${summary.currency} ${summary.avg.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
            />
          </div>

          <Panel className="mt-4">
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">Revenue trend</p>
            <div className="mt-4 h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
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
                    interval={Math.max(0, Math.floor(trend.length / 8))}
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
                      `${summary.currency} ${Number(v).toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
                      "Revenue",
                    ]}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#c9a961" strokeWidth={2} fill="url(#ordersRevenueFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </>
      )}

      {orders && filteredOrders.length === 0 && <EmptyState>No orders in this timeframe.</EmptyState>}

      {filteredOrders.length > 0 && (
        <Panel className="mt-6 overflow-x-auto" padded={false}>
          <table className="w-full min-w-[720px] text-[13px]">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-white/35">
                <th className="px-5 py-3 font-normal">Order</th>
                <th className="px-5 py-3 font-normal">Customer</th>
                <th className="px-5 py-3 font-normal">Date</th>
                <th className="px-5 py-3 font-normal">Items</th>
                <th className="px-5 py-3 font-normal">Total</th>
                <th className="px-5 py-3 font-normal">Payment</th>
                <th className="px-5 py-3 font-normal">Fulfillment</th>
                <th className="px-5 py-3 font-normal" />
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.02]">
                  <td className="px-5 py-3 font-medium text-white/90">{order.name}</td>
                  <td className="px-5 py-3 text-white/70">
                    {order.customer
                      ? `${order.customer.first_name ?? ""} ${order.customer.last_name ?? ""}`.trim() || order.customer.email || "—"
                      : order.email || "—"}
                  </td>
                  <td className="px-5 py-3 text-white/45">{fmtDate(order.created_at)}</td>
                  <td className="px-5 py-3 text-white/45">
                    {order.line_items.reduce((sum, item) => sum + item.quantity, 0)} units
                  </td>
                  <td className="px-5 py-3 font-medium text-white/90">
                    {order.currency} {order.total_price}
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={statusTone(order.financial_status)}>{order.financial_status ?? "—"}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={statusTone(order.fulfillment_status)}>{order.fulfillment_status ?? "unfulfilled"}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {order.fulfillment_status !== "fulfilled" && (
                      <button
                        type="button"
                        onClick={() => setFulfillingOrder(order)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1 text-[11px] text-white/60 transition hover:border-[#c9a961]/50 hover:text-[#c9a961]"
                      >
                        <Truck className="h-3 w-3" />
                        Fulfill
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}

      {fulfillingOrder && (
        <FulfillModal
          order={fulfillingOrder}
          onClose={() => setFulfillingOrder(null)}
          onFulfilled={() => {
            setOrders(
              (prev) =>
                prev?.map((o) => (o.id === fulfillingOrder.id ? { ...o, fulfillment_status: "fulfilled" } : o)) ?? null
            );
            setFulfillingOrder(null);
          }}
        />
      )}
    </div>
  );
}
