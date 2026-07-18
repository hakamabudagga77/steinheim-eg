import Link from "next/link";

const SECTIONS = [
  { href: "/admin/contact", label: "Contact Leads", desc: "General enquiries submitted through the site's contact page." },
  { href: "/trade-admin", label: "Trade Leads", desc: "B2B project quotes and specification requests." },
  { href: "/admin/orders", label: "Orders", desc: "Live Shopify orders, read-only." },
  { href: "/admin/customers", label: "Customers", desc: "Live Shopify customer list, read-only." },
  { href: "/admin/analytics", label: "Analytics", desc: "Site traffic from GA4 (coming soon)." },
  { href: "/admin/content", label: "Content", desc: "Edit site copy without touching code (coming soon)." },
];

export default function AdminDashboardPage() {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.3em] text-black/40">Overview</p>
      <h1 className="mt-2 font-heading text-[32px] tracking-[-0.02em]">Welcome back.</h1>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="block rounded-xl border border-black/8 bg-white p-6 transition hover:border-black/20 hover:shadow-sm"
          >
            <p className="text-[16px] font-medium">{section.label}</p>
            <p className="mt-2 text-[13px] leading-[1.6] text-black/50">{section.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
