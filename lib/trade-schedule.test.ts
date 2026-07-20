import { describe, expect, it } from "vitest";
import {
  buildRoomPlan,
  clampCount,
  createEmptyCustomRoomGroup,
  createEmptyRoomPlan,
  defaultProductNeedsFor,
  presets,
  roomConfig,
} from "@/lib/trade-schedule";

describe("clampCount", () => {
  it("clamps to the 0-500 range", () => {
    expect(clampCount(-5)).toBe(0);
    expect(clampCount(0)).toBe(0);
    expect(clampCount(500)).toBe(500);
    expect(clampCount(1000)).toBe(500);
  });

  it("rounds fractional values", () => {
    expect(clampCount(2.4)).toBe(2);
    expect(clampCount(2.6)).toBe(3);
  });

  it("treats NaN as 0", () => {
    expect(clampCount(NaN)).toBe(0);
  });
});

describe("defaultProductNeedsFor", () => {
  it("gives powder rooms a basin mixer only", () => {
    expect(defaultProductNeedsFor("powder")).toEqual([{ type: "basin-mixer", quantity: 1 }]);
  });

  it("gives suites a wall-mounted mixer and concealed shower", () => {
    expect(defaultProductNeedsFor("suite")).toEqual([
      { type: "wall-mounted", quantity: 1 },
      { type: "concealed-shower", quantity: 1 },
    ]);
  });

  it("gives master bathrooms a tall basin mixer and concealed shower", () => {
    expect(defaultProductNeedsFor("master")).toEqual([
      { type: "tall-basin-mixer", quantity: 1 },
      { type: "concealed-shower", quantity: 1 },
    ]);
  });

  it("gives standard bathrooms a basin mixer and concealed shower", () => {
    expect(defaultProductNeedsFor("standard")).toEqual([
      { type: "basin-mixer", quantity: 1 },
      { type: "concealed-shower", quantity: 1 },
    ]);
  });
});

describe("createEmptyRoomPlan", () => {
  it("seeds all four fixed room kinds at zero count", () => {
    const plan = createEmptyRoomPlan();
    expect(plan.presetId).toBeNull();
    expect(plan.groups.map((g) => g.roomKey).sort()).toEqual(["master", "powder", "standard", "suite"]);
    expect(plan.groups.every((g) => g.count === 0)).toBe(true);
  });

  it("seeds each group's productNeeds from defaultProductNeedsFor", () => {
    const plan = createEmptyRoomPlan();
    const powder = plan.groups.find((g) => g.roomKey === "powder");
    expect(powder?.productNeeds).toEqual(defaultProductNeedsFor("powder"));
  });
});

describe("createEmptyCustomRoomGroup", () => {
  it("builds a custom room group with a clamped count", () => {
    const group = createEmptyCustomRoomGroup("custom-1", "Primary Ensuite", 3);
    expect(group.roomKey).toBe("custom-1");
    expect(group.roomLabel).toBe("Primary Ensuite");
    expect(group.count).toBe(3);
    expect(group.isCustom).toBe(true);
  });

  it("clamps an out-of-range count", () => {
    const group = createEmptyCustomRoomGroup("custom-2", "Spa", 9999);
    expect(group.count).toBe(500);
  });
});

describe("buildRoomPlan", () => {
  it("applies a preset's counts to the fixed room groups", () => {
    const villa = presets.find((p) => p.id === "villa")!;
    const plan = buildRoomPlan(null, villa.id, villa.counts, {}, []);
    expect(plan.presetId).toBe("villa");
    expect(plan.groups.find((g) => g.roomKey === "master")?.count).toBe(1);
    expect(plan.groups.find((g) => g.roomKey === "standard")?.count).toBe(2);
    expect(plan.groups.find((g) => g.roomKey === "powder")?.count).toBe(1);
    expect(plan.groups.find((g) => g.roomKey === "suite")?.count).toBe(0);
  });

  it("adds custom rooms alongside the fixed groups", () => {
    const plan = buildRoomPlan(null, null, { master: 0, standard: 0, powder: 0, suite: 0 }, {}, [
      { roomKey: "custom-1", label: "Primary Ensuite", count: 2 },
    ]);
    const custom = plan.groups.find((g) => g.roomKey === "custom-1");
    expect(custom).toBeDefined();
    expect(custom?.isCustom).toBe(true);
    expect(custom?.count).toBe(2);
    expect(custom?.roomLabel).toBe("Primary Ensuite");
  });

  it("preserves an existing room's confirmed product needs when re-building without explicit new needs", () => {
    const existingPlan = buildRoomPlan(null, "villa", presets[0].counts, {}, []);
    const master = existingPlan.groups.find((g) => g.roomKey === "master")!;
    const customizedNeeds = [{ type: "accessories" as const, quantity: 3 }];
    const withCustomNeeds = buildRoomPlan(
      existingPlan,
      "villa",
      presets[0].counts,
      { master: customizedNeeds },
      []
    );
    expect(withCustomNeeds.groups.find((g) => g.roomKey === "master")?.productNeeds).toEqual(customizedNeeds);

    // Re-building again without passing productNeedsByRoom must keep what was
    // just confirmed, not silently fall back to the generic default.
    const rebuiltWithoutExplicitNeeds = buildRoomPlan(withCustomNeeds, "villa", presets[0].counts, {}, []);
    expect(rebuiltWithoutExplicitNeeds.groups.find((g) => g.roomKey === "master")?.productNeeds).toEqual(
      customizedNeeds
    );
    void master;
  });

  it("clamps counts passed in", () => {
    const plan = buildRoomPlan(null, null, { master: -5, standard: 9999, powder: 0, suite: 0 }, {}, []);
    expect(plan.groups.find((g) => g.roomKey === "master")?.count).toBe(0);
    expect(plan.groups.find((g) => g.roomKey === "standard")?.count).toBe(500);
  });
});

describe("presets / roomConfig", () => {
  it("every preset id is unique", () => {
    const ids = presets.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("roomConfig covers exactly the four fixed room kinds", () => {
    expect(roomConfig.map((r) => r.key).sort()).toEqual(["master", "powder", "standard", "suite"]);
  });
});
