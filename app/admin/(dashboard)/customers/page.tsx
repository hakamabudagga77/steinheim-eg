"use client";

import { useEffect, useState } from "react";
import type { ShopifyCustomer } from "@/lib/shopify-client";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { dateStyle: "medium" });
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<ShopifyCustomer[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/customers")
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Could not load customers.");
        }
        return res.json();
      })
      .then((data) => setCustomers(data.customers))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.3em] text-black/40">Customers</p>
      <h1 className="mt-2 font-heading text-[32px] tracking-[-0.02em]">
        {customers ? `${customers.length} customer${customers.length === 1 ? "" : "s"}` : "Loading…"}
      </h1>
      <p className="mt-2 text-[13px] text-black/40">Live from Shopify · read-only</p>

      {error && <p className="mt-6 text-[14px] text-red-600">{error}</p>}

      {customers && customers.length === 0 && (
        <p className="mt-6 text-[14px] text-black/45">No customers yet.</p>
      )}

      <div className="mt-8 overflow-x-auto rounded-xl border border-black/8 bg-white">
        {customers && customers.length > 0 && (
          <table className="w-full min-w-[640px] text-[13px]">
            <thead>
              <tr className="border-b border-black/8 text-left text-black/40">
                <th className="px-5 py-3 font-normal">Name</th>
                <th className="px-5 py-3 font-normal">Email</th>
                <th className="px-5 py-3 font-normal">Phone</th>
                <th className="px-5 py-3 font-normal">Orders</th>
                <th className="px-5 py-3 font-normal">Total spent</th>
                <th className="px-5 py-3 font-normal">Customer since</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-b border-black/6 last:border-b-0">
                  <td className="px-5 py-3 font-medium">
                    {`${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim() || "—"}
                  </td>
                  <td className="px-5 py-3">
                    {customer.email ? (
                      <a href={`mailto:${customer.email}`} className="underline">{customer.email}</a>
                    ) : "—"}
                  </td>
                  <td className="px-5 py-3 text-black/60">{customer.phone || "—"}</td>
                  <td className="px-5 py-3 text-black/60">{customer.orders_count}</td>
                  <td className="px-5 py-3 font-medium">{customer.total_spent}</td>
                  <td className="px-5 py-3 text-black/60">{fmtDate(customer.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
