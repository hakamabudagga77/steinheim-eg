"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { ArrowUpRight, BriefcaseBusiness, PackageX, Truck } from "lucide-react";
import DigestTestButton from "@/components/admin/DigestTestButton";
import type { ContactLead } from "@/lib/contact-leads";
import type { ShopifyOrder, ShopifyProduct } from "@/lib/shopify-client";
import type { TradeLead } from "@/lib/trade-leads";
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

function Metric({ label, value, hint, delay = 0 }: { label: string; value: string; hint?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-baseline justify-between gap-4 border-t border-white/[0.06] py-4 first:border-t-0 first:pt-0"
    >
      <p className="text-[13px] text-white/40">{label}</p>
      <div className="text-right">
        <p className="font-heading text-[20px] tracking-[-0.01em] text-white">{value}</p>
        {hint && <p className="text-[11px] text-white/30">{hint}</p>}
      </div>
    </motion.div>
  );
}

function SectionList({
  title,
  seeAllHref,
  items,
  delay = 0,
}: {
  title: string;
  seeAllHref: string;
  items: Array<{ id: string; label: string; detail: string; at: string; href: string; dot: string }>;
  delay?: number;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-[0.25em] text-white/35">{title}</p>
        <Link href={seeAllHref} className="text-[11px] text-white/30 transition hover:text-[#0a84ff]">
          See all
        </Link>
      </div>
      <div className="mt-4">
        {items.length === 0 && <p className="py-6 text-[13px] text-white/30">Nothing yet.</p>}
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="group flex items-center justify-between gap-3 border-t border-white/[0.06] py-3.5 first:border-t-0"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${item.dot}`} />
              <div className="min-w-0">
                <p className="truncate text-[13.5px] text-white/85">{item.label}</p>
                <p className="truncate text-[11.5px] text-white/35">{item.detail}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-[11px] text-white/25">{fmtRelative(item.at)}</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-white/0 transition group-hover:text-white/40" />
            </div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}

function AttentionItem({
  icon: Icon,
  tone,
  label,
  detail,
  href,
  delay = 0,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: "red" | "orange" | "blue";
  label: string;
  detail: string;
  href: string;
  delay?: number;
}) {
  const toneClasses = {
    red: { bg: "bg-[#ff453a]/[0.1]", text: "text-[#ff453a]", ring: "hover:border-[#ff453a]/30" },
    orange: { bg: "bg-[#ff9f0a]/[0.1]", text: "text-[#ff9f0a]", ring: "hover:border-[#ff9f0a]/30" },
    blue: { bg: "bg-[#0a84ff]/[0.1]", text: "text-[#0a84ff]", ring: "hover:border-[#0a84ff]/30" },
  }[tone];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        href={href}
        className={`flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.015] px-4 py-3.5 transition ${toneClasses.ring}`}
      >
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${toneClasses.bg} ${toneClasses.text}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] font-medium text-white/90">{label}</p>
          <p className="truncate text-[11.5px] text-white/40">{detail}</p>
        </div>
        <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-white/25" />
      </Link>
    </motion.div>
  );
}

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<ShopifyOrder[] | null>(null);
  const [products, setProducts] = useState<ShopifyProduct[] | null>(null);
  const [leads, setLeads] = useState<ContactLead[] | null>(null);
  const [tradeLeads, setTradeLeads] = useState<TradeLead[] | null>(null);
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
    fetch("/api/trade/leads").then((r) => (r.ok ? r.json() : null)).then((d) => d && setTradeLeads(d.leads));
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

  const newContactLeadsCount = useMemo(() => leads?.filter((l) => l.status === "new").length ?? 0, [leads]);
  const newTradeLeadsCount = useMemo(() => tradeLeads?.filter((l) => l.status === "new" && !l.archivedAt).length ?? 0, [tradeLeads]);
  const totalNewLeads = newContactLeadsCount + newTradeLeadsCount;
  const leadsLoaded = leads !== null && tradeLeads !== null;

  const tradeLeadsAwaitingReview = useMemo(
    () => tradeLeads?.filter((l) => !l.archivedAt && ["new", "reviewing"].includes(l.status)) ?? [],
    [tradeLeads]
  );

  const lowStockCount = useMemo(() => {
    if (!products) return null;
    return products.reduce(
      (sum, p) => sum + p.variants.filter((v) => v.inventory_quantity <= LOW_STOCK_THRESHOLD).length,
      0
    );
  }, [products]);

  const unfulfilledOrders = useMemo(
    () => orders?.filter((o) => o.fulfillment_status !== "fulfilled" && o.financial_status === "paid") ?? [],
    [orders]
  );

  const recentLeads = useMemo(() => {
    const items: Array<{ id: string; label: string; detail: string; at: string; href: string; dot: string }> = [];
    leads?.forEach((l) =>
      items.push({ id: `lead-${l.id}`, label: l.name, detail: l.subject || l.enquiryType, at: l.submittedAt, href: "/admin/contact", dot: "bg-[#0a84ff]" })
    );
    tradeLeads?.forEach((l) =>
      items.push({
        id: `trade-${l.id}`,
        label: l.project.details.projectName || l.reference,
        detail: l.project.details.company || "Trade enquiry",
        at: l.submittedAt,
        href: "/admin/trade",
        dot: "bg-[#ff453a]",
      })
    );
    return items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 5);
  }, [leads, tradeLeads]);

  const recentOrders = useMemo(() => {
    return [...(orders ?? [])]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map((o) => ({
        id: `order-${o.id}`,
        label: o.name,
        detail: `${o.currency} ${Number(o.total_price).toLocaleString("en-US", { maximumFractionDigits: 0 })} · ${o.financial_status ?? "pending"}`,
        at: o.created_at,
        href: "/admin/orders",
        dot: "bg-[#30d158]",
      }));
  }, [orders]);

  const attentionReady = tradeLeads !== null && orders !== null && products !== null;
  const hasAttentionItems = tradeLeadsAwaitingReview.length > 0 || lowStockCount !== null && lowStockCount > 0 || unfulfilledOrders.length > 0;

  return (
    <div>
      {/* Header row */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-white/30">Steinheim Egypt</p>
          <h1 className="mt-2 font-heading text-[34px] tracking-[-0.02em] text-white">Good to see you.</h1>
        </div>
        <DigestTestButton />
      </div>

      {/* Needs attention */}
      {attentionReady && hasAttentionItems && (
        <div className="mt-8">
          <p className="text-[11px] uppercase tracking-[0.25em] text-white/35">Needs attention</p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tradeLeadsAwaitingReview.length > 0 && (
              <AttentionItem
                icon={BriefcaseBusiness}
                tone="blue"
                label={`${tradeLeadsAwaitingReview.length} trade request${tradeLeadsAwaitingReview.length === 1 ? "" : "s"} awaiting review`}
                detail={tradeLeadsAwaitingReview[0].project.details.projectName || tradeLeadsAwaitingReview[0].reference}
                href="/admin/trade"
              />
            )}
            {unfulfilledOrders.length > 0 && (
              <AttentionItem
                icon={Truck}
                tone="blue"
                label={`${unfulfilledOrders.length} order${unfulfilledOrders.length === 1 ? "" : "s"} to fulfill`}
                detail="Paid and waiting on shipment"
                href="/admin/orders"
                delay={0.05}
              />
            )}
            {lowStockCount !== null && lowStockCount > 0 && (
              <AttentionItem
                icon={PackageX}
                tone="orange"
                label={`${lowStockCount} variant${lowStockCount === 1 ? "" : "s"} low on stock`}
                detail={`At or below ${LOW_STOCK_THRESHOLD} units`}
                href="/admin/products"
                delay={0.1}
              />
            )}
          </div>
        </div>
      )}

      {/* Hero: revenue + chart */}
      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,340px)_1fr]">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}>
          <p className="text-[11px] uppercase tracking-[0.25em] text-white/35">Revenue, last 30 days</p>
          {last30 ? (
            <p className="mt-3 font-heading text-[56px] leading-none tracking-[-0.03em] text-white">
              {last30.currency} <span className="tabular-nums">{last30.revenue.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
            </p>
          ) : (
            <div className="mt-3 h-[56px] w-[220px] animate-pulse rounded-lg bg-white/[0.04]" />
          )}
          <p className="mt-3 text-[13px] text-white/35">{last30 ? `${last30.count} orders` : "…"}</p>

          <div className="mt-10 space-y-0">
            <Metric label="New leads" value={leadsLoaded ? String(totalNewLeads) : "…"} hint="Contact + trade" delay={0.05} />
            <Metric
              label="Low stock"
              value={lowStockCount !== null ? String(lowStockCount) : "…"}
              hint={`≤ ${LOW_STOCK_THRESHOLD} units`}
              delay={0.1}
            />
            <Metric
              label="Visitors, 30d"
              value={ga4 ? ga4.activeUsers.toLocaleString() : ga4Error ? "—" : "…"}
              hint={ga4 ? `${ga4.sessions} sessions` : ga4Error ? "GA4 not set up" : undefined}
              delay={0.15}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex flex-col justify-end rounded-3xl border border-white/[0.06] bg-gradient-to-b from-white/[0.02] to-transparent p-6"
        >
          <p className="absolute left-6 top-6 text-[11px] uppercase tracking-[0.25em] text-white/25">Revenue trend</p>
          <div className="h-[280px] w-full">
            {orders ? (
              <RevenueChart data={revenueTrend} />
            ) : (
              <div className="h-full animate-pulse rounded-2xl bg-white/[0.03]" />
            )}
          </div>
        </motion.div>
      </div>

      {/* Grouped by section, not a merged timeline — each world stays its own list */}
      <div className="mt-14 grid grid-cols-1 gap-10 lg:grid-cols-3">
        <SectionList title="Leads" seeAllHref="/admin/contact" items={recentLeads} delay={0.15} />
        <SectionList title="Orders" seeAllHref="/admin/orders" items={recentOrders} delay={0.2} />

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}>
          <p className="text-[11px] uppercase tracking-[0.25em] text-white/35">Visitors, 30 days</p>
          <div className="mt-4 h-[160px]">
            {ga4 ? (
              <VisitorsChart data={ga4.dailyUsers} />
            ) : (
              <div className="flex h-full items-center justify-center text-[12px] text-white/25">
                {ga4Error ? "Not configured yet" : "Loading…"}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
