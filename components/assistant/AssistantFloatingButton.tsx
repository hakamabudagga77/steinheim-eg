"use client";

import { Link, usePathname } from "@/i18n/navigation";

export default function AssistantFloatingButton() {
  const pathname = usePathname();
  if (pathname === "/assistant") return null;

  return (
    <Link
      href="/assistant"
      className="fixed bottom-6 right-6 z-40 hidden items-center gap-3 border border-charcoal/10 bg-white/92 px-4 py-3 text-[10px] font-medium uppercase tracking-[0.16em] text-charcoal shadow-[0_18px_50px_rgba(0,0,0,0.12)] backdrop-blur-md transition hover:border-charcoal/30 hover:bg-white sm:inline-flex"
      aria-label="Open Steinheim AI Concierge"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-charcoal" />
      Concierge
    </Link>
  );
}
