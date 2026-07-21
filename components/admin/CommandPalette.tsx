"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  Inbox,
  Briefcase,
  ShoppingCart,
  Users,
  Package,
  BarChart3,
  Megaphone,
  FileText,
  ShieldCheck,
  Settings,
  LogOut,
  ExternalLink,
  Search,
  type LucideIcon,
} from "lucide-react";
import type { ShopifyOrder, ShopifyCustomer, ShopifyProduct } from "@/lib/shopify-client";
import type { ContactLead } from "@/lib/contact-leads";
import type { TradeLead } from "@/lib/trade-leads";

interface Command {
  id: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  group: string;
  run: () => void;
}

const GROUP_ORDER = ["Go to", "Orders", "Customers", "Contact Leads", "Trade Leads", "Products", "Actions"];
const MAX_RESULTS_PER_GROUP = 5;

interface DataCache {
  orders: ShopifyOrder[] | null;
  customers: ShopifyCustomer[] | null;
  contactLeads: ContactLead[] | null;
  tradeLeads: TradeLead[] | null;
  products: ShopifyProduct[] | null;
}

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const fetchedRef = useRef(false);
  const [cache, setCache] = useState<DataCache>({
    orders: null,
    customers: null,
    contactLeads: null,
    tradeLeads: null,
    products: null,
  });

  // Fetched once, lazily, the first time the palette is opened — not on
  // every admin page load, since most sessions never touch search.
  useEffect(() => {
    if (!open || fetchedRef.current) return;
    fetchedRef.current = true;
    fetch("/api/admin/orders").then((r) => (r.ok ? r.json() : null)).then((d) => d && setCache((c) => ({ ...c, orders: d.orders })));
    fetch("/api/admin/customers?limit=250").then((r) => (r.ok ? r.json() : null)).then((d) => d && setCache((c) => ({ ...c, customers: d.customers })));
    fetch("/api/contact").then((r) => (r.ok ? r.json() : null)).then((d) => d && setCache((c) => ({ ...c, contactLeads: d.leads })));
    fetch("/api/trade/leads").then((r) => (r.ok ? r.json() : null)).then((d) => d && setCache((c) => ({ ...c, tradeLeads: d.leads })));
    fetch("/api/admin/products").then((r) => (r.ok ? r.json() : null)).then((d) => d && setCache((c) => ({ ...c, products: d.products })));
  }, [open]);

  const commands: Command[] = useMemo(
    () => [
      { id: "overview", label: "Overview", icon: LayoutDashboard, group: "Go to", run: () => router.push("/admin") },
      { id: "contact", label: "Contact Leads", icon: Inbox, group: "Go to", run: () => router.push("/admin/contact") },
      { id: "trade", label: "Trade Leads", icon: Briefcase, group: "Go to", run: () => router.push("/admin/trade") },
      { id: "orders", label: "Orders", icon: ShoppingCart, group: "Go to", run: () => router.push("/admin/orders") },
      { id: "customers", label: "Customers", icon: Users, group: "Go to", run: () => router.push("/admin/customers") },
      { id: "products", label: "Products", icon: Package, group: "Go to", run: () => router.push("/admin/products") },
      { id: "analytics", label: "Website Analytics", icon: BarChart3, group: "Go to", run: () => router.push("/admin/analytics") },
      { id: "marketing-analytics", label: "Marketing Analytics", icon: Megaphone, group: "Go to", run: () => router.push("/admin/analytics/marketing") },
      { id: "policies", label: "Policies", icon: ShieldCheck, group: "Go to", run: () => router.push("/admin/policies") },
      { id: "content", label: "Content", icon: FileText, group: "Go to", run: () => router.push("/admin/content") },
      { id: "settings", label: "Settings", icon: Settings, group: "Go to", run: () => router.push("/admin/settings") },
      {
        id: "shopify",
        label: "Open Shopify Admin",
        hint: "opens in a new tab",
        icon: ExternalLink,
        group: "Actions",
        run: () => window.open("https://steinheim.myshopify.com/admin", "_blank", "noopener,noreferrer"),
      },
      {
        id: "live-site",
        label: "View live site",
        hint: "opens in a new tab",
        icon: ExternalLink,
        group: "Actions",
        run: () => window.open("/", "_blank", "noopener,noreferrer"),
      },
      {
        id: "sign-out",
        label: "Sign out",
        icon: LogOut,
        group: "Actions",
        run: () => {
          void fetch("/api/admin/logout", { method: "POST" }).then(() => {
            router.push("/admin/login");
            router.refresh();
          });
        },
      },
    ],
    [router]
  );

  // Data results only kick in once the query is specific enough to be
  // useful — two characters keeps "1007" or "ah" from flooding the list.
  const dataCommands: Command[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const results: Command[] = [];

    (cache.orders ?? [])
      .filter((o) => {
        const customerName = o.customer ? `${o.customer.first_name ?? ""} ${o.customer.last_name ?? ""}` : "";
        return (
          o.name.toLowerCase().includes(q) ||
          customerName.toLowerCase().includes(q) ||
          (o.email ?? "").toLowerCase().includes(q)
        );
      })
      .slice(0, MAX_RESULTS_PER_GROUP)
      .forEach((o) => {
        const customerName = o.customer ? `${o.customer.first_name ?? ""} ${o.customer.last_name ?? ""}`.trim() : "";
        results.push({
          id: `order-${o.id}`,
          label: `${o.name} — ${customerName || o.email || "Guest"}`,
          hint: `${o.currency} ${o.total_price}`,
          icon: ShoppingCart,
          group: "Orders",
          run: () => router.push(`/admin/orders?id=${o.id}`),
        });
      });

    (cache.customers ?? [])
      .filter((c) => {
        const name = `${c.first_name ?? ""} ${c.last_name ?? ""}`;
        return name.toLowerCase().includes(q) || (c.email ?? "").toLowerCase().includes(q);
      })
      .slice(0, MAX_RESULTS_PER_GROUP)
      .forEach((c) => {
        results.push({
          id: `customer-${c.id}`,
          label: `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() || c.email || "—",
          hint: `${c.orders_count} order${c.orders_count === 1 ? "" : "s"}`,
          icon: Users,
          group: "Customers",
          run: () => router.push(`/admin/customers?id=${c.id}`),
        });
      });

    (cache.contactLeads ?? [])
      .filter(
        (l) =>
          l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q) || (l.subject ?? "").toLowerCase().includes(q)
      )
      .slice(0, MAX_RESULTS_PER_GROUP)
      .forEach((l) => {
        results.push({
          id: `contact-${l.id}`,
          label: l.name,
          hint: l.subject || l.enquiryType,
          icon: Inbox,
          group: "Contact Leads",
          run: () => router.push(`/admin/contact?id=${l.id}`),
        });
      });

    (cache.tradeLeads ?? [])
      .filter(
        (l) =>
          (l.project.details.projectName ?? "").toLowerCase().includes(q) ||
          (l.project.details.company ?? "").toLowerCase().includes(q) ||
          l.reference.toLowerCase().includes(q)
      )
      .slice(0, MAX_RESULTS_PER_GROUP)
      .forEach((l) => {
        results.push({
          id: `trade-${l.id}`,
          label: l.project.details.projectName || l.reference,
          hint: l.project.details.company || "Trade enquiry",
          icon: Briefcase,
          group: "Trade Leads",
          run: () => router.push("/admin/trade"),
        });
      });

    (cache.products ?? [])
      .filter((p) => p.title.toLowerCase().includes(q))
      .slice(0, MAX_RESULTS_PER_GROUP)
      .forEach((p) => {
        results.push({
          id: `product-${p.id}`,
          label: p.title,
          hint: p.product_type || undefined,
          icon: Package,
          group: "Products",
          run: () => router.push(`/admin/products?id=${p.id}`),
        });
      });

    return results;
  }, [cache, query, router]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const staticMatches = q ? commands.filter((c) => c.label.toLowerCase().includes(q)) : commands;
    return [...staticMatches, ...dataCommands];
  }, [commands, dataCommands, query]);

  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => {
          const next = !v;
          if (next) {
            setQuery("");
            setActiveIndex(0);
          }
          return next;
        });
        return;
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [open]);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  function openPalette() {
    setQuery("");
    setActiveIndex(0);
    setOpen(true);
  }

  function handleListKeydown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const cmd = filtered[activeIndex];
      if (cmd) {
        setOpen(false);
        cmd.run();
      }
    }
  }

  const groups = GROUP_ORDER.filter((g) => filtered.some((c) => c.group === g));

  return (
    <>
      <button
        type="button"
        onClick={openPalette}
        className="flex items-center gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-left text-[12px] text-white/35 transition hover:border-white/[0.12] hover:text-white/55"
      >
        <Search className="h-3.5 w-3.5 shrink-0" />
        <span className="flex-1">Search everything…</span>
        <kbd className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-white/30">⌘K</kbd>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] flex items-start justify-center bg-black/70 px-4 pt-[12vh]"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/[0.08] bg-[#131316] shadow-2xl"
            >
              <div className="flex items-center gap-3 border-b border-white/[0.08] px-4 py-3.5">
                <Search className="h-4 w-4 shrink-0 text-white/30" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActiveIndex(0);
                  }}
                  onKeyDown={handleListKeydown}
                  placeholder="Search orders, customers, leads, products…"
                  className="flex-1 bg-transparent text-[14px] text-white outline-none placeholder:text-white/25"
                />
                <kbd className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-white/30">esc</kbd>
              </div>

              <div className="max-h-[420px] overflow-y-auto p-2">
                {filtered.length === 0 && <p className="px-3 py-6 text-center text-[13px] text-white/30">No matches.</p>}
                {groups.map((group) => {
                  const items = filtered.filter((c) => c.group === group);
                  if (items.length === 0) return null;
                  return (
                    <div key={group} className="mb-1 last:mb-0">
                      <p className="px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] text-white/25">{group}</p>
                      {items.map((cmd) => {
                        const globalIndex = filtered.indexOf(cmd);
                        const active = globalIndex === activeIndex;
                        const Icon = cmd.icon;
                        return (
                          <button
                            key={cmd.id}
                            type="button"
                            onMouseEnter={() => setActiveIndex(globalIndex)}
                            onClick={() => {
                              setOpen(false);
                              cmd.run();
                            }}
                            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13.5px] transition ${
                              active ? "bg-[#0a84ff]/12 text-white" : "text-white/70"
                            }`}
                          >
                            <Icon className={`h-4 w-4 shrink-0 ${active ? "text-[#0a84ff]" : "text-white/35"}`} />
                            <span className="flex-1 truncate">{cmd.label}</span>
                            {cmd.hint && <span className="shrink-0 text-[11px] text-white/25">{cmd.hint}</span>}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
