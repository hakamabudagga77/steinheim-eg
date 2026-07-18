export const TRADE_PROJECT_STORAGE_KEY = "steinheim-trade-project-v1";
export const TRADE_WORKSPACE_STORAGE_KEY = "steinheim-trade-workspace-v2";

export const TRADE_PERSONAS = [
  "hospitality",
  "residential-development",
  "interior-design",
  "villa-private",
  "branded-residence",
  "contractor-mep",
] as const;
export type TradePersona = (typeof TRADE_PERSONAS)[number];

export const TRADE_PERSONA_LABELS: Record<TradePersona, string> = {
  hospitality: "Hotel & Hospitality",
  "residential-development": "Residential Development",
  "interior-design": "Interior Design Studio",
  "villa-private": "Villa / Private Project",
  "branded-residence": "Branded Residence Development",
  "contractor-mep": "Contractor / MEP",
};

export interface PersonaMeta {
  description: string;
  icon: string;
  skipFixedRooms?: boolean;
  roomsTitle: string;
  roomsBody: string;
  customRoomCopy: string;
}

export const PERSONA_META: Record<TradePersona, PersonaMeta> = {
  hospitality: {
    description: "Hotels, resorts, guesthouses — repeatable specs across many rooms.",
    icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
    roomsTitle: "How many rooms in total?",
    roomsBody: "This is the full property. You'll assign a collection to each group next, right here on this page.",
    customRoomCopy: "Room name — e.g. Presidential Suite",
  },
  "residential-development": {
    description: "Compounds, apartment buildings, villa communities — unit types at scale.",
    icon: "M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z",
    roomsTitle: "How many units in total?",
    roomsBody: "Enter your development's bathroom counts once. You'll assign a collection to each group next, right here on this page.",
    customRoomCopy: "Unit type — e.g. Villa Type A",
  },
  "interior-design": {
    description: "Bespoke villas and apartments — precise, room-by-room specification.",
    icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
    skipFixedRooms: true,
    roomsTitle: "Name each space",
    roomsBody: "Skip generic room types — name each space the way you actually think about it. You'll pick exact products per space next.",
    customRoomCopy: "Room name — e.g. Primary Ensuite",
  },
  "villa-private": {
    description: "A single home or renovation — simple, guided, no jargon.",
    icon: "M5 3v18l7-3 7 3V3H5z",
    roomsTitle: "How many bathrooms does your home have?",
    roomsBody: "Just a rough count is fine — you can adjust anything later.",
    customRoomCopy: "Room name — e.g. Guest Bathroom",
  },
  "branded-residence": {
    description: "Hospitality-branded residential towers — brand-grade consistency at scale.",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    roomsTitle: "How many units in total?",
    roomsBody: "Enter your unit-type breakdown once. Brand-standard finishes can be assigned consistently across every unit type next.",
    customRoomCopy: "Unit type — e.g. Penthouse Collection",
  },
  "contractor-mep": {
    description: "Plumbing and technical coordination — specs first, finishes later.",
    icon: "M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z",
    skipFixedRooms: true,
    roomsTitle: "What do you need to spec?",
    roomsBody: "List what you're coordinating — by area, phase, or system. Technical specs (connection sizes, pressure ratings) come next, before finish decisions.",
    customRoomCopy: "Area or system — e.g. Level 3 Wet Wall",
  },
};

function isTradePersona(value: unknown): value is TradePersona {
  return typeof value === "string" && (TRADE_PERSONAS as readonly string[]).includes(value);
}

export type RoomKey = "master" | "standard" | "powder" | "suite";
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

export interface RoomGroup {
  scopeId: string; // stable: `scope-${roomKey}` — this room type's single product basket
  roomKey: RoomKey | string; // fixed key, or `custom-${id}` for user-added custom rooms
  roomLabel: string;
  count: number;
  isCustom?: boolean;
  productNeeds: RoomProductNeed[]; // explicit checklist of what this room type needs
}

export interface TradeProjectRoomPlan {
  presetId: string | null;
  groups: RoomGroup[]; // always the 4 fixed RoomKeys, plus any custom groups appended
}

export function scopeIdForRoom(roomKey: RoomKey | string) {
  return `scope-${roomKey}`;
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
  persona: TradePersona | null;
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
    persona: null,
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
    const quantity = Math.max(0, Math.min(9999, Math.round(Number(candidate.quantity)) || 0));
    if (quantity <= 0) return [];
    return [{ type: candidate.type, quantity }];
  });
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
  return {
    scopeId: scopeIdForRoom(roomKey),
    roomKey,
    roomLabel,
    count,
    isCustom: true,
    productNeeds: sanitizeProductNeeds(candidate.productNeeds),
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
    return {
      scopeId: scopeIdForRoom(roomKey),
      roomKey,
      roomLabel: typeof stored?.roomLabel === "string" && stored.roomLabel ? stored.roomLabel.slice(0, 80) : capitalize(roomKey),
      count,
      productNeeds: sanitizeProductNeeds(stored?.productNeeds),
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
    persona: isTradePersona(source.persona) ? source.persona : null,
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

/** True once a project has at least one active room with at least one product need —
 * the gate for showing the persistent "your rooms" progress panel outside `/trade`. */
export function hasActiveRoomNeeds(project: TradeProject): boolean {
  return Boolean(
    project.roomPlan?.groups.some(
      (group) => group.count > 0 && group.productNeeds.some((need) => need.quantity > 0)
    )
  );
}
