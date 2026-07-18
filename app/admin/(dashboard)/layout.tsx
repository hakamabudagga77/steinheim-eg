"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", external: false },
  { href: "/admin/contact", label: "Contact Leads", external: false },
  { href: "/trade-admin", label: "Trade Leads", external: true },
  { href: "/admin/orders", label: "Orders", external: false },
  { href: "/admin/customers", label: "Customers", external: false },
  { href: "/admin/analytics", label: "Analytics", external: false },
  { href: "/admin/content", label: "Content", external: false },
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
    <div className="flex min-h-screen bg-[#ece9e2] text-[#0a0a0a]">
      <aside className="flex w-[240px] shrink-0 flex-col border-r border-black/8 bg-white px-6 py-8">
        <p className="text-[11px] uppercase tracking-[0.3em] text-black/40">Steinheim Egypt</p>
        <p className="mt-1 font-heading text-[20px] tracking-[-0.02em]">Admin</p>

        <nav className="mt-10 flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = !item.external && pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2.5 text-[14px] transition ${
                  active ? "bg-black text-white" : "text-black/65 hover:bg-black/5"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-6 rounded-lg px-3 py-2.5 text-left text-[13px] text-black/45 transition hover:bg-black/5 hover:text-black"
        >
          Sign out
        </button>
      </aside>

      <main className="flex-1 overflow-y-auto px-10 py-10">{children}</main>
    </div>
  );
}
