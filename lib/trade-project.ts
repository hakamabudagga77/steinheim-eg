export const TRADE_PROJECT_STORAGE_KEY = "steinheim-trade-project-v1";
export const TRADE_WORKSPACE_STORAGE_KEY = "steinheim-trade-workspace-v2";

export type RoomKey = "master" | "standard" | "powder" | "suite";
export type LevelKey = "practical" | "premium" | "signature";
export const ROOM_KEYS: RoomKey[] = ["master", "standard", "powder", "suite"];

export type RequirementType =
  | "basin-mixer"
  | "tall-basin-mixer"
  | "wall-mounted"
  | "concealed-shower"
  | "free-standing"
  | "accessories"
  | "bidet-spray";

export const REQUIREMENT_TYPE_LABELS: Record<RequirementType, string> = {
  "basin-mixer": "Basin mixer",
  "tall-basin-mixer": "Tall basin mixer",
  "wall-mounted": "Wall-mounted basin mixer",
  "concealed-shower": "Concealed shower",
  "free-standing": "Free-standing bath mixer",
  accessories: "Accessories set",
  "bidet-spray": "Bidet spray",
};

export interface RoomProductNeed {
  type: RequirementType;
  quantity: number;
}

export interface TradeProjectItem {
  slug: string;
  finish: string;
  quantity: number;
  scopeId?: string;
  scopeName?: string;
  scopeSummary?: string;
}

export interface RoomGroupAssignment {
  mode: "tier" | "custom";
  // Tier mode only: one starting collection + finish drives auto-fill from the room's productNeeds.
  seriesId?: string;
  finish?: string;
}

export interface RoomGroupAllocation {
  id: string; // stable once created
  scopeId: string; // stable per allocation: `${roomKey}-alloc-${id}`
  roomCount: number; // how many of this group's rooms this allocation covers
  assignment: RoomGroupAssignment;
  label?: string; // free text, e.g. "West wing", "Primary ensuite"
}

export interface RoomGroup {
  scopeId: string; // stable: `scope-${roomKey}` — bucket for ad-hoc PDP quick-adds for this room type
  roomKey: RoomKey | string; // fixed key, or `custom-${id}` for user-added custom rooms
  roomLabel: string;
  count: number;
  isCustom?: boolean;
  productNeeds: RoomProductNeed[]; // explicit checklist of what this room type needs
  allocations: RoomGroupAllocation[];
}

export interface TradeProjectRoomPlan {
  presetId: string | null;
  groups: RoomGroup[]; // always the 4 fixed RoomKeys, plus any custom groups appended
}

export function scopeIdForRoom(roomKey: RoomKey | string) {
  return `scope-${roomKey}`;
}

export function createAllocationId() {
  return `alloc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createCustomRoomKey() {
  return `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export interface TradeProjectDetails {
  contactName: string;
  role: string;
  company: string;
  projectName: string;
  projectType: string;
  location: string;
  timeline: string;
  email: string;
  phone: string;
  notes: string;
}

export interface TradeProject {
  id: string;
  items: TradeProjectItem[];
  details: TradeProjectDetails;
  roomPlan: TradeProjectRoomPlan | null;
  createdAt: string;
  updatedAt: string;
  status: "draft" | "submitted";
  submittedLeadId: string;
}

export interface TradeWorkspace {
  activeProjectId: string;
  projects: TradeProject[];
}

export function createProjectId() {
  return `project-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createEmptyTradeProject(id = ""): TradeProject {
  return {
    id,
    items: [],
    details: {
      contactName: "",
      role: "",
      company: "",
      projectName: "",
      projectType: "",
      location: "",
      timeline: "",
      email: "",
      phone: "",
      notes: "",
    },
    roomPlan: null,
    createdAt: "",
    updatedAt: "",
    status: "draft",
    submittedLeadId: "",
  };
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const REQUIREMENT_TYPES = Object.keys(REQUIREMENT_TYPE_LABELS) as RequirementType[];

function isRequirementType(value: unknown): value is RequirementType {
  return typeof value === "string" && (REQUIREMENT_TYPES as string[]).includes(value);
}

function sanitizeProductNeeds(value: unknown): RoomProductNeed[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, REQUIREMENT_TYPES.length).flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const candidate = entry as Partial<RoomProductNeed>;
    if (!isRequirementType(candidate.type)) return [];
    const quantity = Math.max(0, Math.min(20, Math.round(Number(candidate.quantity)) || 0));
    if (quantity <= 0) return [];
    return [{ type: candidate.type, quantity }];
  });
}

function sanitizeRoomGroupAssignment(value: unknown): RoomGroupAssignment | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<RoomGroupAssignment>;
  if (candidate.mode !== "tier" && candidate.mode !== "custom") return null;
  return {
    mode: candidate.mode,
    seriesId: typeof candidate.seriesId === "string" ? candidate.seriesId.slice(0, 60) : undefined,
    finish: typeof candidate.finish === "string" ? candidate.finish.slice(0, 60) : undefined,
  };
}

function sanitizeRoomGroupAllocation(value: unknown): RoomGroupAllocation | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<RoomGroupAllocation>;
  const assignment = sanitizeRoomGroupAssignment(candidate.assignment);
  if (!assignment) return null;
  const roomCount = Math.max(0, Math.min(500, Math.round(Number(candidate.roomCount)) || 0));
  if (roomCount <= 0) return null;
  return {
    id: typeof candidate.id === "string" && candidate.id ? candidate.id.slice(0, 60) : createAllocationId(),
    scopeId: typeof candidate.scopeId === "string" && candidate.scopeId ? candidate.scopeId.slice(0, 80) : `alloc-${createAllocationId()}`,
    roomCount,
    assignment,
    label: typeof candidate.label === "string" ? candidate.label.trim().slice(0, 80) || undefined : undefined,
  };
}

function sanitizeAllocationsList(value: unknown): RoomGroupAllocation[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 25).flatMap((entry) => {
    const parsed = sanitizeRoomGroupAllocation(entry);
    return parsed ? [parsed] : [];
  });
}

/** Migrates tonight's pre-allocation single-`assignment` shape into a one-item allocations array,
 * reusing the OLD fixed `scope-${roomKey}` id so items already in project.items aren't orphaned. */
function migrateLegacyAssignment(stored: Record<string, unknown> | undefined, roomKey: string, count: number): RoomGroupAllocation[] {
  const migrated = sanitizeRoomGroupAssignment(stored?.assignment);
  if (!migrated || count <= 0) return [];
  return [{ id: createAllocationId(), scopeId: scopeIdForRoom(roomKey), roomCount: count, assignment: migrated }];
}

function sanitizeCustomRoomGroup(value: unknown): RoomGroup | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<RoomGroup> & Record<string, unknown>;
  if (!candidate.isCustom) return null;
  const roomLabel = typeof candidate.roomLabel === "string" ? candidate.roomLabel.trim().slice(0, 80) : "";
  if (!roomLabel) return null;
  const count = Math.max(0, Math.min(500, Math.round(Number(candidate.count)) || 0));
  const roomKey = typeof candidate.roomKey === "string" && candidate.roomKey.startsWith("custom-")
    ? candidate.roomKey.slice(0, 60)
    : createCustomRoomKey();
  const allocations = Array.isArray(candidate.allocations)
    ? sanitizeAllocationsList(candidate.allocations)
    : migrateLegacyAssignment(candidate as Record<string, unknown>, roomKey, count);
  return {
    scopeId: scopeIdForRoom(roomKey),
    roomKey,
    roomLabel,
    count,
    isCustom: true,
    productNeeds: sanitizeProductNeeds(candidate.productNeeds),
    allocations,
  };
}

export function sanitizeRoomPlan(value: unknown): TradeProjectRoomPlan | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Partial<TradeProjectRoomPlan>;
  if (!Array.isArray(source.groups)) return null;

  const fixedGroups: RoomGroup[] = ROOM_KEYS.map((roomKey) => {
    const stored = source.groups?.find(
      (entry) => entry && typeof entry === "object" && (entry as Partial<RoomGroup>).roomKey === roomKey
    ) as (Partial<RoomGroup> & Record<string, unknown>) | undefined;
    const count = Math.max(0, Math.min(500, Math.round(Number(stored?.count) || 0)));
    const allocations = Array.isArray(stored?.allocations)
      ? sanitizeAllocationsList(stored.allocations)
      : migrateLegacyAssignment(stored as Record<string, unknown> | undefined, roomKey, count);
    return {
      scopeId: scopeIdForRoom(roomKey),
      roomKey,
      roomLabel: typeof stored?.roomLabel === "string" && stored.roomLabel ? stored.roomLabel.slice(0, 80) : capitalize(roomKey),
      count,
      productNeeds: sanitizeProductNeeds(stored?.productNeeds),
      allocations,
    };
  });

  const customGroups = source.groups
    .filter((entry) => entry && typeof entry === "object" && (entry as Partial<RoomGroup> & Record<string, unknown>).isCustom)
    .slice(0, 20)
    .flatMap((entry) => {
      const parsed = sanitizeCustomRoomGroup(entry);
      return parsed ? [parsed] : [];
    });

  return {
    presetId: typeof source.presetId === "string" ? source.presetId.slice(0, 40) : null,
    groups: [...fixedGroups, ...customGroups],
  };
}

export function sanitizeTradeProject(value: unknown): TradeProject | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Partial<TradeProject>;
  if (!Array.isArray(source.items) || !source.details || typeof source.details !== "object") return null;
  const items = source.items.slice(0, 100).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const candidate = item as Partial<TradeProjectItem>;
    if (typeof candidate.slug !== "string" || typeof candidate.finish !== "string") return [];
    const quantity = Math.max(1, Math.min(10_000, Math.round(Number(candidate.quantity) || 1)));
    return [{
      slug: candidate.slug.slice(0, 120),
      finish: candidate.finish.slice(0, 60),
      quantity,
      scopeId: typeof candidate.scopeId === "string" ? candidate.scopeId.slice(0, 80) : undefined,
      scopeName: typeof candidate.scopeName === "string" ? candidate.scopeName.trim().slice(0, 120) : undefined,
      scopeSummary: typeof candidate.scopeSummary === "string" ? candidate.scopeSummary.trim().slice(0, 240) : undefined,
    }];
  });
  const empty = createEmptyTradeProject();
  const details = Object.fromEntries(
    Object.keys(empty.details).map((key) => {
      const field = key as keyof TradeProjectDetails;
      const candidate = source.details?.[field];
      return [field, typeof candidate === "string" ? candidate.trim().slice(0, field === "notes" ? 2000 : 200) : ""];
    })
  ) as unknown as TradeProjectDetails;
  return {
    id: typeof source.id === "string" ? source.id.slice(0, 80) : "",
    items,
    details,
    roomPlan: sanitizeRoomPlan(source.roomPlan),
    createdAt: typeof source.createdAt === "string" ? source.createdAt.slice(0, 40) : "",
    updatedAt: typeof source.updatedAt === "string" ? source.updatedAt.slice(0, 40) : "",
    status: source.status === "submitted" ? "submitted" : "draft",
    submittedLeadId: typeof source.submittedLeadId === "string" ? source.submittedLeadId.slice(0, 100) : "",
  };
}

export function sanitizeTradeWorkspace(value: unknown): TradeWorkspace | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Partial<TradeWorkspace>;
  if (!Array.isArray(source.projects)) return null;
  const projects = source.projects
    .slice(0, 25)
    .flatMap((project) => {
      const parsed = sanitizeTradeProject(project);
      if (!parsed) return [];
      return [{ ...parsed, id: parsed.id || createProjectId() }];
    });
  if (!projects.length) return null;
  const requestedActive = typeof source.activeProjectId === "string" ? source.activeProjectId : "";
  return {
    projects,
    activeProjectId: projects.some((project) => project.id === requestedActive)
      ? requestedActive
      : projects[0].id,
  };
}

export function getProjectCompletion(project: TradeProject) {
  const checks = [
    project.items.length > 0,
    Boolean(project.details.projectName),
    Boolean(project.details.projectType),
    Boolean(project.details.location),
    Boolean(project.details.timeline),
    Boolean(project.details.contactName),
    /^\S+@\S+\.\S+$/.test(project.details.email),
    Boolean(project.details.phone),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}
