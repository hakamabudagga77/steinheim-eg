"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
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
  LogOut,
} from "lucide-react";
import CommandPalette from "@/components/admin/CommandPalette";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, external: false },
  { href: "/admin/contact", label: "Contact Leads", icon: Inbox, external: false },
  { href: "/admin/trade", label: "Trade Leads", icon: Briefcase, external: false },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart, external: false },
  { href: "/admin/customers", label: "Customers", icon: Users, external: false },
  { href: "/admin/products", label: "Products", icon: Package, external: false },
  { href: "/admin/analytics", label: "Website Analytics", icon: BarChart3, external: false },
  { href: "/admin/analytics/marketing", label: "Marketing Analytics", icon: Megaphone, external: false },
  { href: "/admin/policies", label: "Policies", icon: ShieldCheck, external: false },
  { href: "/admin/content", label: "Content", icon: FileText, external: false },
];

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="relative flex min-h-screen bg-[#0a0a0b] text-white">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed -right-40 -top-40 z-0 h-[560px] w-[560px] rounded-full bg-[#0a84ff]/[0.05] blur-[140px]"
      />
      <aside className="relative z-10 flex w-[248px] shrink-0 flex-col overflow-hidden border-r border-white/[0.06] bg-[#0d0d0f] px-5 py-7">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-[#0a84ff]/[0.08] blur-[80px]"
        />
        <div className="relative px-2">
          <Image src="/images/brand/steinheim-logo-white.png" alt="Steinheim" width={140} height={28} className="h-6 w-auto" priority />
          <p className="mt-2 text-[10px] uppercase tracking-[0.3em] text-white/30">Admin</p>
        </div>

        <div className="relative mt-6 px-0.5">
          <CommandPalette />
        </div>

        <nav className="relative mt-6 flex flex-1 flex-col gap-0.5">
          {NAV_ITEMS.map((item) => {
            const active = !item.external && pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13.5px] transition ${
                  active ? "bg-white/[0.06] text-white" : "text-white/45 hover:bg-white/[0.03] hover:text-white/80"
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-4 w-[2.5px] -translate-y-1/2 rounded-full bg-[#0a84ff]" />
                )}
                <Icon className={`h-[15px] w-[15px] shrink-0 ${active ? "text-[#0a84ff]" : ""}`} />
                <span className="truncate">{item.label}</span>
                {item.external && <span className="ml-auto text-[10px] text-white/25">↗</span>}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 flex items-center gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span className="text-[12px] text-white/45">Live</span>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-2 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[13px] text-white/35 transition hover:bg-white/[0.03] hover:text-white/70"
        >
          <LogOut className="h-[15px] w-[15px]" />
          Sign out
        </button>
      </aside>

      <main className="relative z-10 flex-1 overflow-y-auto px-10 py-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto max-w-[1400px]"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
