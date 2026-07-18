"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Users, Repeat, Wallet, Search, ArrowUpRight } from "lucide-react";
import type { ShopifyCustomer, ShopifyOrder } from "@/lib/shopify-client";
import { PageHeader, StatCard, StatCardSkeleton, Badge, EmptyState, ErrorState, InlineEdit } from "@/components/admin/ui";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { dateStyle: "medium" });
}

function initials(customer: ShopifyCustomer) {
  const a = customer.first_name?.[0] ?? "";
  const b = customer.last_name?.[0] ?? "";
  return (a + b).toUpperCase() || "—";
}

function tierFor(customer: ShopifyCustomer): { label: string; tone: "accent" | "positive" | "neutral" } {
  const spent = Number(customer.total_spent || 0);
  if (spent >= 50000 || customer.orders_count >= 3) return { label: "VIP", tone: "accent" };
  if (customer.orders_count > 1) return { label: "Returning", tone: "positive" };
  return { label: "New", tone: "neutral" };
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<ShopifyCustomer[] | null>(null);
  const [orders, setOrders] = useState<ShopifyOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/admin/customers?limit=250")
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Could not load customers.");
        }
        return res.json();
      })
      .then((data) => setCustomers(data.customers))
      .catch((err) => setError(err.message));
    fetch("/api/admin/orders")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setOrders(d.orders))
      .catch(() => {});
  }, []);

  const stats = useMemo(() => {
    if (!customers) return null;
    const returning = customers.filter((c) => c.orders_count > 1).length;
    const totalSpent = customers.reduce((sum, c) => sum + Number(c.total_spent || 0), 0);
    return { returning, totalSpent };
  }, [customers]);

  const sorted = useMemo(() => {
    if (!customers) return [];
    return [...customers].sort((a, b) => Number(b.total_spent || 0) - Number(a.total_spent || 0));
  }, [customers]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((c) => {
      const name = `${c.first_name ?? ""} ${c.last_name ?? ""}`.toLowerCase();
      return name.includes(q) || (c.email ?? "").toLowerCase().includes(q);
    });
  }, [sorted, query]);

  useEffect(() => {
    if (filtered.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!filtered.some((c) => c.id === selectedId)) {
      setSelectedId(filtered[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered]);

  const selected = filtered.find((c) => c.id === selectedId) ?? null;

  const selectedOrders = useMemo(() => {
    if (!selected || !orders) return [];
    return orders
      .filter((o) => o.customer?.id === selected.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [selected, orders]);

  async function saveField(customerId: number, field: "phone" | "email" | "note", value: string) {
    const res = await fetch("/api/admin/customers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId, [field]: value }),
    });
    if (!res.ok) throw new Error("Failed");
    setCustomers((prev) => prev?.map((c) => (c.id === customerId ? { ...c, [field]: value } : c)) ?? null);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Customers"
        title={customers ? `${customers.length} customer${customers.length === 1 ? "" : "s"}` : "Loading…"}
        subtitle="Live from Shopify · click a customer to view their profile"
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
        <div className="mt-6 flex gap-5 rounded-2xl border border-white/[0.08] bg-[#131316]">
          {/* Directory list pane */}
          <div className="w-[300px] shrink-0 border-r border-white/[0.08]">
            <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
              <Search className="h-3.5 w-3.5 shrink-0 text-white/30" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name or email…"
                className="w-full bg-transparent text-[13px] text-white outline-none placeholder:text-white/25"
              />
            </div>
            <div className="max-h-[560px] divide-y divide-white/[0.05] overflow-y-auto py-1">
              {filtered.length === 0 && <p className="px-4 py-6 text-[13px] text-white/30">No matches.</p>}
              {filtered.map((customer) => {
                const active = customer.id === selectedId;
                const tier = tierFor(customer);
                return (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => setSelectedId(customer.id)}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
                      active ? "bg-[#0a84ff]/[0.09]" : "hover:bg-white/[0.025]"
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-medium ${
                        tier.tone === "accent" ? "bg-[#0a84ff]/15 text-[#0a84ff]" : "bg-white/[0.06] text-white/50"
                      }`}
                    >
                      {initials(customer)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] text-white/85">
                        {`${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim() || customer.email || "—"}
                      </p>
                      <p className="truncate text-[11.5px] text-white/35">
                        {customer.orders_count} order{customer.orders_count === 1 ? "" : "s"} · EGP{" "}
                        {Number(customer.total_spent || 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Profile pane */}
          {selected && (
            <div className="min-w-0 flex-1 px-7 py-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0a84ff]/12 text-[15px] font-medium text-[#0a84ff]">
                    {initials(selected)}
                  </div>
                  <div>
                    <h2 className="font-heading text-[20px] tracking-[-0.01em] text-white">
                      {`${selected.first_name ?? ""} ${selected.last_name ?? ""}`.trim() || "—"}
                    </h2>
                    <p className="mt-0.5 text-[13px] text-white/35">Customer since {fmtDate(selected.created_at)}</p>
                  </div>
                </div>
                <Badge tone={tierFor(selected).tone}>{tierFor(selected).label}</Badge>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4 border-t border-white/[0.06] pt-5 text-[13px] sm:grid-cols-4">
                <div>
                  <p className="text-white/35">Email</p>
                  <div className="mt-1 text-[#0a84ff]">
                    <InlineEdit
                      value={selected.email ?? ""}
                      onSave={(v) => saveField(selected.id, "email", v)}
                      confirmMessage={(v) => `Change this customer's email to "${v}"? This updates the live Shopify store immediately.`}
                    />
                  </div>
                </div>
                <div>
                  <p className="text-white/35">Phone</p>
                  <div className="mt-1 text-white/75">
                    <InlineEdit
                      value={selected.phone ?? ""}
                      onSave={(v) => saveField(selected.id, "phone", v)}
                      confirmMessage={(v) => `Change this customer's phone to "${v}"? This updates the live Shopify store immediately.`}
                    />
                  </div>
                </div>
                <div>
                  <p className="text-white/35">Orders</p>
                  <p className="mt-1 text-white/75">{selected.orders_count}</p>
                </div>
                <div>
                  <p className="text-white/35">Total spent</p>
                  <p className="mt-1 text-white/75">EGP {Number(selected.total_spent || 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}</p>
                </div>
              </div>

              <div className="mt-5 border-t border-white/[0.06] pt-5">
                <p className="text-white/35">Note</p>
                <div className="mt-1 text-[13px] text-white/60">
                  <InlineEdit
                    value={selected.note ?? ""}
                    onSave={(v) => saveField(selected.id, "note", v)}
                    className="w-full"
                    confirmMessage={(v) => `Save "${v}" as the note for this customer?`}
                  />
                </div>
              </div>

              <div className="mt-6 border-t border-white/[0.06] pt-5">
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">Order history</p>
                <div className="mt-3">
                  {orders === null && <p className="text-[13px] text-white/25">Loading…</p>}
                  {orders !== null && selectedOrders.length === 0 && (
                    <p className="text-[13px] text-white/30">No orders on record for this customer.</p>
                  )}
                  {selectedOrders.map((order) => (
                    <Link
                      key={order.id}
                      href="/admin/orders"
                      className="group flex items-center justify-between gap-3 border-t border-white/[0.05] py-3 first:border-t-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[13.5px] text-white/85">{order.name}</p>
                        <p className="truncate text-[11.5px] text-white/35">{fmtDate(order.created_at)}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-[13px] font-medium text-white/80">
                          {order.currency} {order.total_price}
                        </span>
                        <ArrowUpRight className="h-3.5 w-3.5 text-white/0 transition group-hover:text-white/40" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
