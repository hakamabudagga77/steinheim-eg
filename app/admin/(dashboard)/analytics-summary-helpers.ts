export interface GA4Summary {
  activeUsers: number;
  sessions: number;
  pageViews: number;
  avgSessionDuration: number;
  topPages: Array<{ path: string; views: number }>;
  topSources: Array<{ source: string; sessions: number }>;
  dailyUsers: Array<{ date: string; users: number }>;
}

export function fmtDate(yyyymmdd: string) {
  if (yyyymmdd.length !== 8) return yyyymmdd;
  const d = new Date(`${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// Pure Unicode trick: regional indicator symbols are each ASCII letter's
// code point + a fixed offset, and a pair of them renders as that country's
// flag -- no image asset or library needed. Shared between the Analytics
// page's Top markets panel and the realtime pulse's country breakdown.
export function flagEmoji(code: string): string {
  if (!/^[A-Za-z]{2}$/.test(code)) return "";
  const REGIONAL_INDICATOR_OFFSET = 127397;
  return [...code.toUpperCase()].map((c) => String.fromCodePoint(c.codePointAt(0)! + REGIONAL_INDICATOR_OFFSET)).join("");
}
