"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import { Link } from "@/i18n/navigation";

// Renders a slim campaign strip above the hero whenever a date-driven window
// is active. Copy and window live in the campaign store (managed from the
// no-code admin UI at /admin/campaigns) and are resolved client-side from
// /api/campaigns/active, so launching a campaign needs no code or deploy.
// Renders nothing outside a window, and animates in smoothly when one starts.
interface ActiveCampaign {
  id: string;
  href: string;
  copy: { eyebrow: string; title: string; body: string; cta: string };
}

export default function CampaignBanner() {
  const locale = useLocale();
  const [campaign, setCampaign] = useState<ActiveCampaign | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/campaigns/active?locale=${locale}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { campaign?: ActiveCampaign | null } | null) => {
        if (!cancelled) setCampaign(data?.campaign ?? null);
      })
      .catch(() => {
        if (!cancelled) setCampaign(null);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  if (!loaded || !campaign) return null;

  return (
    <motion.section
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden bg-[#0a0a0a] text-[#ece9e2]"
    >
      <div className="px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-[1780px] flex-wrap items-center justify-center gap-x-6 gap-y-2 text-center sm:justify-between sm:text-start">
          <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <span className="text-[9px] font-medium uppercase tracking-[0.3em] text-[#ece9e2]/50">
              {campaign.copy.eyebrow}
            </span>
            <span className="font-heading text-[18px] italic leading-none">{campaign.copy.title}</span>
            <span className="text-[12px] text-[#ece9e2]/65">{campaign.copy.body}</span>
          </p>
          <Link
            href={campaign.href}
            className="text-[10px] font-medium uppercase tracking-[0.22em] underline underline-offset-4 transition hover:text-white"
          >
            {campaign.copy.cta}
          </Link>
        </div>
      </div>
    </motion.section>
  );
}
