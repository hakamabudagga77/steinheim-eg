"use client";

import { useEffect, useMemo, useState } from "react";
import type { ShopifyOrder } from "@/lib/shopify-client";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

function statusTone(status: string | null) {
  if (status === "paid" || status === "fulfilled") return "bg-black text-white";
  if (status === "pending" || status === "partial") return "bg-black/8 text-black/60";
  if (status === "refunded" || status === "cancelled" || status === "voided") return "bg-black/5 text-black/35";
  return "bg-black/8 text-black/60";
}

type Timeframe = "today" | "7d" | "30d" | "all" | "custom";

const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  today: "Today",
  "7d": "7 days",
  "30d": "30 days",
  all: "All time",
  custom: "Custom",
};

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

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    if (timeframe === "all") return orders;

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
    } else {
      if (!customStart || !customEnd) return orders;
      start = startOfDay(new Date(customStart));
      end = new Date(customEnd);
      end.setHours(23, 59, 59, 999);
    }

    return orders.filter((o) => {
      const created = new Date(o.created_at);
      return created >= start && created <= end;
    });
  }, [orders, timeframe, customStart, customEnd]);

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

  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.3em] text-black/40">Orders</p>
      <h1 className="mt-2 font-heading text-[32px] tracking-[-0.02em]">
        {orders ? `${orders.length} order${orders.length === 1 ? "" : "s"}` : "Loading…"}
      </h1>
      <p className="mt-2 text-[13px] text-black/40">Live from Shopify · read-only</p>

      {error && <p className="mt-6 text-[14px] text-red-600">{error}</p>}

      {orders && (
        <>
          <div className="mt-8 flex flex-wrap items-center gap-2">
            {(["today", "7d", "30d", "all", "custom"] as Timeframe[]).map((tf) => (
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
            {timeframe === "custom" && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="rounded-full border border-black/15 px-3 py-1.5 text-[12px]"
                />
                <span className="text-black/40">to</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="rounded-full border border-black/15 px-3 py-1.5 text-[12px]"
                />
              </div>
            )}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-black/8 bg-white p-6">
              <p className="text-[11px] uppercase tracking-[0.2em] text-black/40">Revenue</p>
              <p className="mt-2 text-[26px] font-medium">
                {summary.currency} {summary.revenue.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </p>
              <p className="mt-1 text-[11px] text-black/35">Gross, excludes voided orders</p>
            </div>
            <div className="rounded-xl border border-black/8 bg-white p-6">
              <p className="text-[11px] uppercase tracking-[0.2em] text-black/40">Orders</p>
              <p className="mt-2 text-[26px] font-medium">{summary.count}</p>
            </div>
            <div className="rounded-xl border border-black/8 bg-white p-6">
              <p className="text-[11px] uppercase tracking-[0.2em] text-black/40">Average order value</p>
              <p className="mt-2 text-[26px] font-medium">
                {summary.currency} {summary.avg.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </>
      )}

      {orders && filteredOrders.length === 0 && (
        <p className="mt-6 text-[14px] text-black/45">No orders in this timeframe.</p>
      )}

      <div className="mt-8 overflow-x-auto rounded-xl border border-black/8 bg-white">
        {filteredOrders.length > 0 && (
          <table className="w-full min-w-[720px] text-[13px]">
            <thead>
              <tr className="border-b border-black/8 text-left text-black/40">
                <th className="px-5 py-3 font-normal">Order</th>
                <th className="px-5 py-3 font-normal">Customer</th>
                <th className="px-5 py-3 font-normal">Date</th>
                <th className="px-5 py-3 font-normal">Items</th>
                <th className="px-5 py-3 font-normal">Total</th>
                <th className="px-5 py-3 font-normal">Payment</th>
                <th className="px-5 py-3 font-normal">Fulfillment</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-b border-black/6 last:border-b-0">
                  <td className="px-5 py-3 font-medium">{order.name}</td>
                  <td className="px-5 py-3">
                    {order.customer
                      ? `${order.customer.first_name ?? ""} ${order.customer.last_name ?? ""}`.trim() || order.customer.email || "—"
                      : order.email || "—"}
                  </td>
                  <td className="px-5 py-3 text-black/60">{fmtDate(order.created_at)}</td>
                  <td className="px-5 py-3 text-black/60">
                    {order.line_items.reduce((sum, item) => sum + item.quantity, 0)} units
                  </td>
                  <td className="px-5 py-3 font-medium">
                    {order.currency} {order.total_price}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] ${statusTone(order.financial_status)}`}>
                      {order.financial_status ?? "—"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] ${statusTone(order.fulfillment_status)}`}>
                      {order.fulfillment_status ?? "unfulfilled"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
