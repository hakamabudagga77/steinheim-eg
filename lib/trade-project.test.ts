import { describe, expect, it } from "vitest";
import {
  createEmptyTradeProject,
  createProjectId,
  createCustomRoomKey,
  getProjectCompletion,
  hasActiveRoomNeeds,
  isRequirementType,
  sanitizeRoomPlan,
  sanitizeTradeProject,
  sanitizeTradeWorkspace,
  scopeIdForRoom,
} from "@/lib/trade-project";

describe("scopeIdForRoom", () => {
  it("prefixes the room key", () => {
    expect(scopeIdForRoom("master")).toBe("scope-master");
    expect(scopeIdForRoom("custom-abc")).toBe("scope-custom-abc");
  });
});

describe("createCustomRoomKey / createProjectId", () => {
  it("generates unique custom room keys", () => {
    const a = createCustomRoomKey();
    const b = createCustomRoomKey();
    expect(a).toMatch(/^custom-/);
    expect(a).not.toBe(b);
  });

  it("generates unique project ids", () => {
    const a = createProjectId();
    const b = createProjectId();
    expect(a).toMatch(/^project-/);
    expect(a).not.toBe(b);
  });
});

describe("createEmptyTradeProject", () => {
  it("returns a draft project with empty items and details", () => {
    const project = createEmptyTradeProject();
    expect(project.status).toBe("draft");
    expect(project.items).toEqual([]);
    expect(project.roomPlan).toBeNull();
    expect(project.persona).toBeNull();
  });

  it("uses the provided id when given", () => {
    expect(createEmptyTradeProject("fixed-id").id).toBe("fixed-id");
  });
});

describe("isRequirementType", () => {
  it("accepts every real requirement type", () => {
    expect(isRequirementType("basin-mixer")).toBe(true);
    expect(isRequirementType("concealed-shower")).toBe(true);
  });

  it("rejects unknown or non-string values", () => {
    expect(isRequirementType("not-a-real-type")).toBe(false);
    expect(isRequirementType(null)).toBe(false);
    expect(isRequirementType(42)).toBe(false);
    expect(isRequirementType(undefined)).toBe(false);
  });
});

describe("sanitizeRoomPlan", () => {
  it("returns null for non-object input", () => {
    expect(sanitizeRoomPlan(null)).toBeNull();
    expect(sanitizeRoomPlan("not a plan")).toBeNull();
  });

  it("returns null when groups isn't an array", () => {
    expect(sanitizeRoomPlan({ presetId: "villa" })).toBeNull();
  });

  it("rebuilds a valid plan, clamping counts and dropping invalid product needs", () => {
    const plan = sanitizeRoomPlan({
      presetId: "villa",
      groups: [
        { roomKey: "master", roomLabel: "Master bathrooms", count: 2, productNeeds: [{ type: "basin-mixer", quantity: 1 }] },
        { roomKey: "standard", roomLabel: "Standard bathrooms", count: 9999, productNeeds: [{ type: "not-real", quantity: 5 }] },
      ],
    });
    expect(plan).not.toBeNull();
    expect(plan?.presetId).toBe("villa");
    expect(plan?.groups.find((g) => g.roomKey === "master")?.count).toBe(2);
    // Over-range count gets clamped, not rejected.
    expect(plan?.groups.find((g) => g.roomKey === "standard")?.count).toBe(500);
    // Invalid requirement type in productNeeds is dropped, not kept as garbage.
    expect(plan?.groups.find((g) => g.roomKey === "standard")?.productNeeds).toEqual([]);
    // All four fixed room kinds are always present, even if absent from input.
    expect(plan?.groups.map((g) => g.roomKey)).toEqual(
      expect.arrayContaining(["master", "standard", "powder", "suite"])
    );
  });

  it("keeps custom room groups that are properly marked isCustom with a label", () => {
    const plan = sanitizeRoomPlan({
      presetId: null,
      groups: [
        { roomKey: "custom-1", roomLabel: "Primary Ensuite", count: 1, isCustom: true, productNeeds: [] },
        { roomLabel: "", isCustom: true, count: 1, productNeeds: [] }, // no label -> dropped
      ],
    });
    const customGroups = plan?.groups.filter((g) => g.isCustom);
    expect(customGroups).toHaveLength(1);
    expect(customGroups?.[0].roomLabel).toBe("Primary Ensuite");
  });
});

describe("sanitizeTradeProject", () => {
  it("returns null for non-object input or missing items/details", () => {
    expect(sanitizeTradeProject(null)).toBeNull();
    expect(sanitizeTradeProject({})).toBeNull();
    expect(sanitizeTradeProject({ items: [] })).toBeNull(); // missing details
  });

  it("rebuilds a minimally valid project with empty items and details", () => {
    const project = sanitizeTradeProject({ items: [], details: {} });
    expect(project).not.toBeNull();
    expect(project?.items).toEqual([]);
    expect(project?.status).toBe("draft");
  });

  it("drops malformed items but keeps valid ones", () => {
    const project = sanitizeTradeProject({
      items: [
        { slug: "joy-basin-mixer", finish: "chrome", quantity: 2 },
        { slug: 123, finish: "chrome" }, // invalid slug type -> dropped
        { finish: "chrome", quantity: 1 }, // missing slug -> dropped
      ],
      details: {},
    });
    expect(project?.items).toHaveLength(1);
    expect(project?.items[0]).toMatchObject({ slug: "joy-basin-mixer", finish: "chrome", quantity: 2 });
  });

  it("clamps item quantity into range and marks status submitted only when explicitly set", () => {
    const project = sanitizeTradeProject({
      items: [{ slug: "x", finish: "y", quantity: -5 }],
      details: {},
      status: "submitted",
    });
    expect(project?.items[0].quantity).toBe(1);
    expect(project?.status).toBe("submitted");
  });

  it("sanitizes a nested roomPlan through sanitizeRoomPlan", () => {
    const project = sanitizeTradeProject({
      items: [],
      details: {},
      roomPlan: { presetId: "hotel", groups: [] },
    });
    expect(project?.roomPlan?.presetId).toBe("hotel");
  });
});

describe("sanitizeTradeWorkspace", () => {
  it("returns null for non-object input or when projects isn't an array", () => {
    expect(sanitizeTradeWorkspace(null)).toBeNull();
    expect(sanitizeTradeWorkspace({ activeProjectId: "x" })).toBeNull();
  });

  it("returns null when every project fails to sanitize", () => {
    expect(sanitizeTradeWorkspace({ projects: [null, "not a project"] })).toBeNull();
  });

  it("falls back to the first project when activeProjectId doesn't match any project", () => {
    const workspace = sanitizeTradeWorkspace({
      activeProjectId: "does-not-exist",
      projects: [{ id: "p1", items: [], details: {} }],
    });
    expect(workspace?.activeProjectId).toBe("p1");
  });

  it("keeps activeProjectId when it matches a real project", () => {
    const workspace = sanitizeTradeWorkspace({
      activeProjectId: "p2",
      projects: [
        { id: "p1", items: [], details: {} },
        { id: "p2", items: [], details: {} },
      ],
    });
    expect(workspace?.activeProjectId).toBe("p2");
  });
});

describe("getProjectCompletion", () => {
  it("returns 0 for a fully empty project", () => {
    expect(getProjectCompletion(createEmptyTradeProject())).toBe(0);
  });

  it("returns 100 when every check passes", () => {
    const project = createEmptyTradeProject("p1");
    project.items = [{ slug: "x", finish: "y", quantity: 1 }];
    project.details = {
      ...project.details,
      projectName: "Villa X",
      projectType: "Residential",
      location: "Cairo",
      timeline: "Q2 2027",
      contactName: "Karim",
      email: "karim@example.com",
      phone: "0100000000",
    };
    expect(getProjectCompletion(project)).toBe(100);
  });

  it("counts partial completion proportionally", () => {
    const project = createEmptyTradeProject("p1");
    project.items = [{ slug: "x", finish: "y", quantity: 1 }];
    // 1 of 8 checks passes.
    expect(getProjectCompletion(project)).toBe(13);
  });
});

describe("hasActiveRoomNeeds", () => {
  it("is false when there's no room plan", () => {
    expect(hasActiveRoomNeeds(createEmptyTradeProject())).toBe(false);
  });

  it("is false when every room has zero count", () => {
    const project = createEmptyTradeProject("p1");
    project.roomPlan = {
      presetId: null,
      groups: [
        { scopeId: "scope-master", roomKey: "master", roomLabel: "Master", count: 0, productNeeds: [{ type: "basin-mixer", quantity: 1 }] },
      ],
    };
    expect(hasActiveRoomNeeds(project)).toBe(false);
  });

  it("is false when a room has count but zero-quantity needs", () => {
    const project = createEmptyTradeProject("p1");
    project.roomPlan = {
      presetId: null,
      groups: [
        { scopeId: "scope-master", roomKey: "master", roomLabel: "Master", count: 2, productNeeds: [{ type: "basin-mixer", quantity: 0 }] },
      ],
    };
    expect(hasActiveRoomNeeds(project)).toBe(false);
  });

  it("is true when a room has count and at least one positive-quantity need", () => {
    const project = createEmptyTradeProject("p1");
    project.roomPlan = {
      presetId: null,
      groups: [
        { scopeId: "scope-master", roomKey: "master", roomLabel: "Master", count: 1, productNeeds: [{ type: "basin-mixer", quantity: 1 }] },
      ],
    };
    expect(hasActiveRoomNeeds(project)).toBe(true);
  });
});
