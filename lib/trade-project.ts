export const TRADE_PROJECT_STORAGE_KEY = "steinheim-trade-project-v1";
export const TRADE_WORKSPACE_STORAGE_KEY = "steinheim-trade-workspace-v2";

export type RoomKey = "master" | "standard" | "powder" | "suite";
export type LevelKey = "practical" | "premium" | "signature";
export const ROOM_KEYS: RoomKey[] = ["master", "standard", "powder", "suite"];

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
  // Tier mode only: one collection + finish + coverage level drives auto-generation.
  seriesId?: string;
  finish?: string;
  level?: LevelKey;
}

export interface RoomGroup {
  scopeId: string; // stable: `scope-${roomKey}`
  roomKey: RoomKey;
  roomLabel: string;
  count: number;
  assignment: RoomGroupAssignment | null;
}

export interface TradeProjectRoomPlan {
  presetId: string | null;
  groups: RoomGroup[];
}

export function scopeIdForRoom(roomKey: RoomKey) {
  return `scope-${roomKey}`;
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

function sanitizeRoomGroupAssignment(value: unknown): RoomGroupAssignment | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<RoomGroupAssignment>;
  if (candidate.mode !== "tier" && candidate.mode !== "custom") return null;
  const level: LevelKey | undefined =
    candidate.level === "practical" || candidate.level === "premium" || candidate.level === "signature"
      ? candidate.level
      : undefined;
  return {
    mode: candidate.mode,
    seriesId: typeof candidate.seriesId === "string" ? candidate.seriesId.slice(0, 60) : undefined,
    finish: typeof candidate.finish === "string" ? candidate.finish.slice(0, 60) : undefined,
    level,
  };
}

export function sanitizeRoomPlan(value: unknown): TradeProjectRoomPlan | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Partial<TradeProjectRoomPlan>;
  if (!Array.isArray(source.groups)) return null;

  const groups: RoomGroup[] = ROOM_KEYS.map((roomKey) => {
    const stored = source.groups?.find(
      (entry) => entry && typeof entry === "object" && (entry as Partial<RoomGroup>).roomKey === roomKey
    ) as Partial<RoomGroup> | undefined;
    return {
      scopeId: scopeIdForRoom(roomKey),
      roomKey,
      roomLabel: typeof stored?.roomLabel === "string" && stored.roomLabel ? stored.roomLabel.slice(0, 80) : capitalize(roomKey),
      count: Math.max(0, Math.min(500, Math.round(Number(stored?.count) || 0))),
      assignment: sanitizeRoomGroupAssignment(stored?.assignment),
    };
  });

  return {
    presetId: typeof source.presetId === "string" ? source.presetId.slice(0, 40) : null,
    groups,
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
