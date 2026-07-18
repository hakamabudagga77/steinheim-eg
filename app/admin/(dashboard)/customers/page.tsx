"use client";

import { useEffect, useMemo, useState } from "react";
import { Users, Repeat, Wallet } from "lucide-react";
import type { ShopifyCustomer } from "@/lib/shopify-client";
import { PageHeader, Panel, StatCard, StatCardSkeleton, EmptyState, ErrorState } from "@/components/admin/ui";

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

  const stats = useMemo(() => {
    if (!customers) return null;
    const returning = customers.filter((c) => c.orders_count > 1).length;
    const totalSpent = customers.reduce((sum, c) => sum + Number(c.total_spent || 0), 0);
    return { returning, totalSpent };
  }, [customers]);

  return (
    <div>
      <PageHeader
        eyebrow="Customers"
        title={customers ? `${customers.length} customer${customers.length === 1 ? "" : "s"}` : "Loading…"}
        subtitle="Live from Shopify · read-only"
      />

      {error && <ErrorState>{error}</ErrorState>}

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {customers && stats ? (
          <>
            <StatCard icon={Users} label="Total customers" value={customers.length} accent />
            <StatCard icon={Repeat} label="Returning" value={stats.returning} hint="More than 1 order" />
            <StatCard
              icon={Wallet}
              label="Lifetime spend"
              value={`EGP ${stats.totalSpent.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
            />
          </>
        ) : (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        )}
      </div>

      {customers && customers.length === 0 && <EmptyState>No customers yet.</EmptyState>}

      {customers && customers.length > 0 && (
        <Panel className="mt-6 overflow-x-auto" padded={false}>
          <table className="w-full min-w-[640px] text-[13px]">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-white/35">
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
                <tr key={customer.id} className="border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.02]">
                  <td className="px-5 py-3 font-medium text-white/90">
                    {`${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim() || "—"}
                  </td>
                  <td className="px-5 py-3">
                    {customer.email ? (
                      <a href={`mailto:${customer.email}`} className="text-[#c9a961] underline decoration-white/20">
                        {customer.email}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-5 py-3 text-white/45">{customer.phone || "—"}</td>
                  <td className="px-5 py-3 text-white/45">{customer.orders_count}</td>
                  <td className="px-5 py-3 font-medium text-white/90">{customer.total_spent}</td>
                  <td className="px-5 py-3 text-white/45">{fmtDate(customer.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}
    </div>
  );
}
