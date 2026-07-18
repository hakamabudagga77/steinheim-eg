"use client";

import { useEffect, useState } from "react";
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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<ShopifyOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.3em] text-black/40">Orders</p>
      <h1 className="mt-2 font-heading text-[32px] tracking-[-0.02em]">
        {orders ? `${orders.length} order${orders.length === 1 ? "" : "s"}` : "Loading…"}
      </h1>
      <p className="mt-2 text-[13px] text-black/40">Live from Shopify · read-only</p>

      {error && <p className="mt-6 text-[14px] text-red-600">{error}</p>}

      {orders && orders.length === 0 && (
        <p className="mt-6 text-[14px] text-black/45">No orders yet.</p>
      )}

      <div className="mt-8 overflow-x-auto rounded-xl border border-black/8 bg-white">
        {orders && orders.length > 0 && (
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
              {orders.map((order) => (
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
