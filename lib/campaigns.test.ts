import { describe, expect, it } from "vitest";
import { CAMPAIGNS, getActiveCampaignAt } from "@/lib/campaigns";

describe("getActiveCampaignAt", () => {
  it("resolves an active campaign inside its window", () => {
    const campaign = getActiveCampaignAt("2027-05-18T12:00:00Z");
    expect(campaign?.id).toBe("eid-al-adha");
  });

  it("treats start and end dates as inclusive", () => {
    expect(getActiveCampaignAt("2027-05-16T00:00:00Z")?.id).toBe("eid-al-adha");
    expect(getActiveCampaignAt("2027-05-20T23:59:59Z")?.id).toBe("eid-al-adha");
  });

  it("returns null before, between, and after windows", () => {
    expect(getActiveCampaignAt("2027-05-15T00:00:00Z")).toBeNull();
    expect(getActiveCampaignAt("2027-05-21T00:00:00Z")).toBeNull();
    expect(getActiveCampaignAt("2026-08-06T00:00:00Z")).toBeNull();
  });

  it("supports Date inputs in any timezone", () => {
    const date = new Date("2027-03-01T23:00:00+06:00");
    expect(getActiveCampaignAt(date)?.id).toBe("ramadan-home");
  });

  it("ships a default-off state when nothing is configured for today", () => {
    // No campaign window contains this hard-coded control date.
    const result = getActiveCampaignAt(new Date("2026-01-15T12:00:00Z"));
    expect(result).toBeNull();
  });

  it("keeps campaign ids unique and windows well-formed", () => {
    const ids = new Set(CAMPAIGNS.map((c) => c.id));
    expect(ids.size).toBe(CAMPAIGNS.length);
    for (const c of CAMPAIGNS) {
      expect(c.startsAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(c.endsAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(c.endsAt >= c.startsAt).toBe(true);
      expect(c.href.startsWith("/")).toBe(true);
    }
  });
});
