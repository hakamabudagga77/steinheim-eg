import { describe, expect, it } from "vitest";
import type { RoomGroup, TradeProject } from "@/lib/trade-project";
import { projectCoverage, requiredUnitsFor, requiredUnitsForGroup } from "@/lib/trade-quantities";

function group(overrides: Partial<RoomGroup> = {}): RoomGroup {
  return {
    scopeId: "scope-standard",
    roomKey: "standard",
    roomLabel: "Standard bathroom",
    count: 40,
    productNeeds: [{ type: "basin-mixer", quantity: 1 }],
    ...overrides,
  } as RoomGroup;
}

function project(groups: RoomGroup[], items: TradeProject["items"] = []): TradeProject {
  return { items, roomPlan: { presetId: null, groups } } as TradeProject;
}

describe("requiredUnitsFor", () => {
  it("multiplies rooms by units per room", () => {
    // The bug this guards: a 40-room floor needing 1 mixer each was reported
    // as needing 1 unit in total.
    expect(requiredUnitsFor({ count: 40 }, { quantity: 1 })).toBe(40);
    expect(requiredUnitsFor({ count: 5 }, { quantity: 2 })).toBe(10);
  });

  it("returns zero when either side is zero", () => {
    expect(requiredUnitsFor({ count: 0 }, { quantity: 3 })).toBe(0);
    expect(requiredUnitsFor({ count: 12 }, { quantity: 0 })).toBe(0);
  });
});

describe("requiredUnitsForGroup", () => {
  it("sums every need across the room count", () => {
    const g = group({
      count: 10,
      productNeeds: [
        { type: "basin-mixer", quantity: 1 },
        { type: "concealed-shower", quantity: 2 },
      ],
    });
    expect(requiredUnitsForGroup(g)).toBe(30);
  });
});

describe("projectCoverage", () => {
  it("does not mark a 40-room floor complete after a single unit", () => {
    const p = project(
      [group({ count: 40, productNeeds: [{ type: "basin-mixer", quantity: 1 }] })],
      [{ slug: "joy-basin-mixer", finish: "chrome", quantity: 1, scopeId: "scope-standard" }] as TradeProject["items"]
    );
    const coverage = projectCoverage(p);
    expect(coverage.needed).toBe(40);
    expect(coverage.percent).toBeLessThan(100);
    expect(coverage.remaining).toBeGreaterThan(0);
  });

  it("reaches 100% only when every room is covered", () => {
    const p = project(
      [group({ count: 40, productNeeds: [{ type: "basin-mixer", quantity: 1 }] })],
      [{ slug: "joy-basin-mixer", finish: "chrome", quantity: 40, scopeId: "scope-standard" }] as TradeProject["items"]
    );
    expect(projectCoverage(p).percent).toBe(100);
  });

  it("clamps per need so over-ordering one line cannot hide a missing one", () => {
    const p = project(
      [
        group({
          count: 2,
          productNeeds: [
            { type: "basin-mixer", quantity: 1 },
            { type: "concealed-shower", quantity: 1 },
          ],
        }),
      ],
      [{ slug: "joy-basin-mixer", finish: "chrome", quantity: 99, scopeId: "scope-standard" }] as TradeProject["items"]
    );
    const coverage = projectCoverage(p);
    expect(coverage.needed).toBe(4);
    expect(coverage.selected).toBe(2);
    expect(coverage.percent).toBe(50);
  });

  it("ignores groups with a zero room count", () => {
    expect(projectCoverage(project([group({ count: 0 })])).needed).toBe(0);
  });
});
