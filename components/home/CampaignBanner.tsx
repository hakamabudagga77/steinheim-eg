"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getActiveCampaignAt } from "@/lib/campaigns";

// Renders a slim campaign strip above the hero whenever a date-driven window
// is active (see lib/campaigns.ts). Renders nothing otherwise, so the home
// page stays untouched outside a campaign.
export default function CampaignBanner() {
  const t = useTranslations("campaigns");
  const campaign = getActiveCampaignAt();
  if (!campaign) return null;

  return (
    <section className="bg-[#0a0a0a] px-5 py-4 text-[#ece9e2] sm:px-8">
      <div className="mx-auto flex max-w-[1780px] flex-wrap items-center justify-center gap-x-6 gap-y-2 text-center sm:justify-between sm:text-start">
        <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <span className="text-[9px] font-medium uppercase tracking-[0.3em] text-[#ece9e2]/50">
            {t(`${campaign.id}.eyebrow`)}
          </span>
          <span className="font-heading text-[18px] italic leading-none">
            {t(`${campaign.id}.title`)}
          </span>
          <span className="text-[12px] text-[#ece9e2]/65">{t(`${campaign.id}.body`)}</span>
        </p>
        <Link
          href={campaign.href}
          className="text-[10px] font-medium uppercase tracking-[0.22em] underline underline-offset-4 transition hover:text-white"
        >
          {t(`${campaign.id}.cta`)}
        </Link>
      </div>
    </section>
  );
}
