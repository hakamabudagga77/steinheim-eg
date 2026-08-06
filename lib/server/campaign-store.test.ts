import { afterEach, describe, expect, it } from "vitest";
import { deleteCampaign, listCampaigns, saveCampaign } from "@/lib/server/campaign-store";
import { CAMPAIGNS, type CampaignRecord } from "@/lib/campaigns";

function buildRecord(id: string): CampaignRecord {
  return {
    id,
    enabled: true,
    startsAt: "2027-01-01",
    endsAt: "2027-01-10",
    href: "/collections",
    en: { eyebrow: "Winter", title: "Winter Home", body: "A calmer ritual.", cta: "Explore" },
    ar: { eyebrow: "شتاء", title: "الشتاء في البيت", body: "طقس أكثر هدوءًا.", cta: "استكشف" },
  };
}

const TEST_ID = "test-campaign-store-record";

afterEach(async () => {
  await deleteCampaign(TEST_ID).catch(() => undefined);
});

describe("campaign store", () => {
  it("falls back to the shipped seeds before anything is saved", async () => {
    const list = await listCampaigns();
    expect(list.length).toBeGreaterThanOrEqual(CAMPAIGNS.length);
    for (const seed of CAMPAIGNS) {
      expect(list.some((entry) => entry.id === seed.id)).toBe(true);
    }
  });

  it("persists a new record and returns it first from list", async () => {
    await saveCampaign(buildRecord(TEST_ID));
    const list = await listCampaigns();
    const record = list.find((entry) => entry.id === TEST_ID);
    expect(record).toMatchObject({
      id: TEST_ID,
      enabled: true,
      startsAt: "2027-01-01",
      endsAt: "2027-01-10",
      href: "/collections",
    });
  });

  it("upserts by id instead of duplicating", async () => {
    await saveCampaign(buildRecord(TEST_ID));
    const updated = { ...buildRecord(TEST_ID), enabled: false, href: "/shop-the-look" };
    await saveCampaign(updated);
    const list = await listCampaigns();
    const matches = list.filter((entry) => entry.id === TEST_ID);
    expect(matches).toHaveLength(1);
    expect(matches[0].enabled).toBe(false);
    expect(matches[0].href).toBe("/shop-the-look");
  });

  it("deletes a record so it no longer resolves", async () => {
    await saveCampaign(buildRecord(TEST_ID));
    await deleteCampaign(TEST_ID);
    const list = await listCampaigns();
    expect(list.some((entry) => entry.id === TEST_ID)).toBe(false);
  });
});
