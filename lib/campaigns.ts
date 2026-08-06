export interface CampaignCopy {
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
}

export interface CampaignRecord {
  id: string;
  /** Disabled campaigns never resolve, so they can be staged without going live. */
  enabled: boolean;
  /** Inclusive start, yyyy-mm-dd. */
  startsAt: string;
  /** Inclusive end, yyyy-mm-dd. */
  endsAt: string;
  /** Localized CTA destination. */
  href: string;
  en: CampaignCopy;
  ar: CampaignCopy;
}

// Self-contained date-driven merchandising windows. Copy lives on the record
// (both locales), so a campaign ships without touching components or message
// files — the admin UI at /admin/campaigns edits these records, and the store
// (`lib/server/campaign-store.ts`) persists them. These are the seeds shipped
// in the repo: used as the fallback when the store is empty, and by tests.
export const CAMPAIGNS: ReadonlyArray<CampaignRecord> = [
  {
    id: "eid-al-adha",
    enabled: true,
    startsAt: "2027-05-16",
    endsAt: "2027-05-20",
    href: "/collections",
    en: {
      eyebrow: "Seasonal offer",
      title: "Eid at Home",
      body: "Coordinated bathroom sets, ready for the season.",
      cta: "Explore collections",
    },
    ar: {
      eyebrow: "عرض موسمي",
      title: "العيد في البيت",
      body: "طقم حمامات متناسق، جاهز للموسم.",
      cta: "استكشف المجموعات",
    },
  },
  {
    id: "ramadan-home",
    enabled: true,
    startsAt: "2027-02-08",
    endsAt: "2027-03-09",
    href: "/shop-the-look",
    en: {
      eyebrow: "Seasonal offer",
      title: "Ramadan Home",
      body: "A calmer bathroom ritual for the season.",
      cta: "Shop the look",
    },
    ar: {
      eyebrow: "عرض موسمي",
      title: "رمضان في البيت",
      body: "طقس حمام أكثر هدوءًا في الموسم.",
      cta: "تسوق الإطلالات",
    },
  },
];

function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Resolves the active campaign for a date. Pure and injectable for tests.
 * Only enabled campaigns inside their (inclusive) window resolve; disabled or
 * out-of-window records return nothing so a stale entry can never surface.
 */
export function getActiveCampaignAt(
  date: Date | string = new Date(),
  records: ReadonlyArray<CampaignRecord> = CAMPAIGNS
): CampaignRecord | null {
  const day = typeof date === "string" ? date.slice(0, 10) : toISODate(date);
  for (const campaign of records) {
    if (!campaign.enabled) continue;
    if (day >= campaign.startsAt && day <= campaign.endsAt) return campaign;
  }
  return null;
}
