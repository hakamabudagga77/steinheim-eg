export interface Campaign {
  id: string;
  /** Inclusive start, yyyy-mm-dd. */
  startsAt: string;
  /** Inclusive end, yyyy-mm-dd. */
  endsAt: string;
  /** Localized CTA destination. */
  href: string;
}

// Date-driven merchandising windows. Copy lives in messages (`campaigns.<id>`),
// so the same engine serves both locales. Adding an entry here (and its i18n
// keys) is all it takes to launch a campaign — no component changes.
export const CAMPAIGNS: ReadonlyArray<Campaign> = [
  {
    id: "eid-al-adha",
    startsAt: "2027-05-16",
    endsAt: "2027-05-20",
    href: "/collections",
  },
  {
    id: "ramadan-home",
    startsAt: "2027-02-08",
    endsAt: "2027-03-09",
    href: "/shop-the-look",
  },
];

function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Resolves the active campaign for a date. Pure and injectable for tests. */
export function getActiveCampaignAt(date: Date | string = new Date()): Campaign | null {
  const day = typeof date === "string" ? date.slice(0, 10) : toISODate(date);
  for (const campaign of CAMPAIGNS) {
    if (day >= campaign.startsAt && day <= campaign.endsAt) return campaign;
  }
  return null;
}
