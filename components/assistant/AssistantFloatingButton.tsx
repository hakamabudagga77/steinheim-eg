"use client";

import { Link, usePathname } from "@/i18n/navigation";

export default function AssistantFloatingButton() {
  const pathname = usePathname();
  if (pathname === "/assistant") return null;

  return (
    <Link
      href="/assistant"
      className="group fixed bottom-6 right-6 z-40 hidden items-center gap-3 rounded-full border border-white/30 bg-black/72 px-4 py-3 text-[10px] font-medium uppercase tracking-[0.18em] text-white shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl transition hover:bg-black sm:inline-flex"
      aria-label="Open Steinheim AI Concierge"
    >
      <span className="relative grid h-8 w-8 place-items-center rounded-full border border-white/20 bg-white/10">
        <span className="absolute inset-0 rounded-full border border-white/20 opacity-0 transition group-hover:scale-150 group-hover:opacity-100" />
        <span className="absolute h-4 w-4 animate-ping rounded-full bg-[#c8a657]/25" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#c8a657]" />
      </span>
      <span>Concierge</span>
    </Link>
  );
}
