"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Inbox,
  Briefcase,
  ShoppingCart,
  Users,
  Package,
  BarChart3,
  FileText,
  Wallet,
  Eye,
  AlertTriangle,
} from "lucide-react";
import dynamic from "next/dynamic";
import { PageHeader, StatCard, StatCardSkeleton, Panel, Badge } from "@/components/admin/ui";
import DigestTestButton from "@/components/admin/DigestTestButton";
import type { ContactLead } from "@/lib/contact-leads";
import type { ShopifyOrder, ShopifyProduct } from "@/lib/shopify-client";
import { type GA4Summary } from "./analytics-summary-helpers";

// Charts pull in recharts (~120 KB gzip). Load them on demand so they stay out
// of the dashboard's initial JS; the pulse placeholder covers the brief load.
const chartPlaceholder = () => <div className="h-full animate-pulse rounded-lg bg-white/[0.04]" />;
const RevenueChart = dynamic(() => import("./DashboardCharts").then((m) => m.RevenueChart), {
  ssr: false,
  loading: chartPlaceholder,
});
const VisitorsChart = dynamic(() => import("./DashboardCharts").then((m) => m.VisitorsChart), {
  ssr: false,
  loading: chartPlaceholder,
});

const LOW_STOCK_THRESHOLD = 10;

const SECTIONS = [
  { href: "/admin/contact", label: "Contact Leads", desc: "General enquiries from the site.", icon: Inbox },
  { href: "/admin/trade", label: "Trade Leads", desc: "B2B project quotes and specs.", icon: Briefcase },
  { href: "/admin/orders", label: "Orders", desc: "Live Shopify orders.", icon: ShoppingCart },
  { href: "/admin/customers", label: "Customers", desc: "Live Shopify customer list.", icon: Users },
  { href: "/admin/products", label: "Products", desc: "Inventory and stock levels.", icon: Package },
  { href: "/admin/analytics", label: "Analytics", desc: "Site traffic from GA4.", icon: BarChart3 },
  { href: "/admin/content", label: "Content", desc: "Edit site copy (coming soon).", icon: FileText },
];

function fmtRelative(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<ShopifyOrder[] | null>(null);
  const [products, setProducts] = useState<ShopifyProduct[] | null>(null);
  const [leads, setLeads] = useState<ContactLead[] | null>(null);
  const [ga4, setGa4] = useState<GA4Summary | null>(null);
  const [ga4Error, setGa4Error] = useState(false);
  const [asOf, setAsOf] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/admin/orders")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setOrders(d.orders);
          setAsOf(Date.now());
        }
      });
    fetch("/api/admin/products").then((r) => (r.ok ? r.json() : null)).then((d) => d && setProducts(d.products));
    fetch("/api/contact").then((r) => (r.ok ? r.json() : null)).then((d) => d && setLeads(d.leads));
    fetch("/api/admin/analytics?start=30daysAgo&end=today")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setGa4(d.summary))
      .catch(() => setGa4Error(true));
  }, []);

  const last30 = useMemo(() => {
    if (!orders || asOf === null) return null;
    const cutoff = asOf - 29 * 86400000;
    const inRange = orders.filter((o) => new Date(o.created_at).getTime() >= cutoff);
    const counted = inRange.filter((o) => o.financial_status !== "voided");
    const revenue = counted.reduce((sum, o) => sum + Number(o.total_price || 0), 0);
    const currency = inRange[0]?.currency ?? "EGP";
    return { count: inRange.length, revenue, currency };
  }, [orders, asOf]);

  const revenueTrend = useMemo(() => {
    if (!orders) return [];
    const days: { date: string; revenue: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
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
  }, [orders]);

  const newLeadsCount = useMemo(() => leads?.filter((l) => l.status === "new").length ?? null, [leads]);

  const lowStockCount = useMemo(() => {
    if (!products) return null;
    return products.reduce(
      (sum, p) => sum + p.variants.filter((v) => v.inventory_quantity <= LOW_STOCK_THRESHOLD).length,
      0
    );
  }, [products]);

  const activity = useMemo(() => {
    const items: Array<{ id: string; kind: "lead" | "order"; label: string; detail: string; at: string; href: string }> = [];
    leads?.slice(0, 6).forEach((l) =>
      items.push({
        id: `lead-${l.id}`,
        kind: "lead",
        label: l.name,
        detail: l.subject || l.enquiryType,
        at: l.submittedAt,
        href: "/admin/contact",
      })
    );
    orders?.slice(0, 6).forEach((o) =>
      items.push({
        id: `order-${o.id}`,
        kind: "order",
        label: o.name,
        detail: `${o.currency} ${o.total_price}`,
        at: o.created_at,
        href: "/admin/orders",
      })
    );
    return items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 8);
  }, [leads, orders]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader eyebrow="Overview" title="Welcome back." subtitle="Everything moving through Steinheim Egypt, at a glance." />
        <DigestTestButton />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {last30 ? (
          <StatCard
            icon={Wallet}
            label="Revenue · 30d"
            value={`${last30.currency} ${last30.revenue.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
            hint={`${last30.count} orders`}
            accent
          />
        ) : (
          <StatCardSkeleton />
        )}
        {newLeadsCount !== null ? (
          <StatCard icon={Inbox} label="New leads" value={newLeadsCount} hint="Contact form" />
        ) : (
          <StatCardSkeleton />
        )}
        {lowStockCount !== null ? (
          <StatCard
            icon={AlertTriangle}
            label="Low stock"
            value={lowStockCount}
            hint={`≤ ${LOW_STOCK_THRESHOLD} units`}
          />
        ) : (
          <StatCardSkeleton />
        )}
        {ga4 ? (
          <StatCard icon={Eye} label="Visitors · 30d" value={ga4.activeUsers.toLocaleString()} hint={`${ga4.sessions} sessions`} />
        ) : ga4Error ? (
          <Panel>
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">Visitors · 30d</p>
            <p className="mt-3 text-[13px] text-white/30">GA4 not configured</p>
          </Panel>
        ) : (
          <StatCardSkeleton />
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">Revenue · last 14 days</p>
          </div>
          <div className="mt-4 h-[180px]">
            {orders ? (
              <RevenueChart data={revenueTrend} />
            ) : (
              <div className="h-full animate-pulse rounded-lg bg-white/[0.04]" />
            )}
          </div>
        </Panel>

        <Panel>
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">Visitors · last 30 days</p>
          <div className="mt-4 h-[180px]">
            {ga4 ? (
              <VisitorsChart data={ga4.dailyUsers} />
            ) : (
              <div className="flex h-full items-center justify-center text-[12px] text-white/25">
                {ga4Error ? "Not configured yet" : "Loading…"}
              </div>
            )}
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2" padded={false}>
          <div className="border-b border-white/[0.06] px-6 py-4">
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">Recent activity</p>
          </div>
          <div className="divide-y divide-white/[0.05]">
            {activity.length === 0 && <p className="px-6 py-6 text-[13px] text-white/30">Nothing yet.</p>}
            {activity.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="flex items-center justify-between gap-4 px-6 py-3.5 transition hover:bg-white/[0.02]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Badge tone={item.kind === "lead" ? "accent" : "positive"}>
                    {item.kind === "lead" ? "Lead" : "Order"}
                  </Badge>
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] text-white/85">{item.label}</p>
                    <p className="truncate text-[12px] text-white/35">{item.detail}</p>
                  </div>
                </div>
                <span className="shrink-0 text-[12px] text-white/25">{fmtRelative(item.at)}</span>
              </Link>
            ))}
          </div>
        </Panel>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <Link
                key={section.href}
                href={section.href}
                className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-[#131316] px-4 py-3.5 transition hover:border-white/20"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-white/50">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-white/85">{section.label}</p>
                  <p className="truncate text-[11.5px] text-white/35">{section.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
