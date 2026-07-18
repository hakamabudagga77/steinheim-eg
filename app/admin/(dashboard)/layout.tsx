"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  Inbox,
  Briefcase,
  ShoppingCart,
  Users,
  Package,
  BarChart3,
  FileText,
  LogOut,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, external: false },
  { href: "/admin/contact", label: "Contact Leads", icon: Inbox, external: false },
  { href: "/trade-admin", label: "Trade Leads", icon: Briefcase, external: true },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart, external: false },
  { href: "/admin/customers", label: "Customers", icon: Users, external: false },
  { href: "/admin/products", label: "Products", icon: Package, external: false },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3, external: false },
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
    <div className="flex min-h-screen bg-[#0a0a0b] text-white">
      <aside className="flex w-[248px] shrink-0 flex-col border-r border-white/[0.06] bg-[#0d0d0f] px-5 py-7">
        <div className="px-2">
          <p className="text-[10px] uppercase tracking-[0.3em] text-white/30">Steinheim Egypt</p>
          <p className="mt-1 font-heading text-[19px] tracking-[-0.02em] text-white">Admin</p>
        </div>

        <nav className="mt-9 flex flex-1 flex-col gap-0.5">
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
                  <span className="absolute left-0 top-1/2 h-4 w-[2.5px] -translate-y-1/2 rounded-full bg-[#c9a961]" />
                )}
                <Icon className={`h-[15px] w-[15px] shrink-0 ${active ? "text-[#c9a961]" : ""}`} />
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

      <main className="flex-1 overflow-y-auto px-10 py-10">
        <div className="mx-auto max-w-[1400px]">{children}</div>
      </main>
    </div>
  );
}
