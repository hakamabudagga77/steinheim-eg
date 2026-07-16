"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  createAllocationId,
  createCustomRoomKey,
  createEmptyTradeProject,
  createProjectId,
  sanitizeTradeProject,
  sanitizeTradeWorkspace,
  TRADE_PROJECT_STORAGE_KEY,
  TRADE_WORKSPACE_STORAGE_KEY,
  type RoomGroupAssignment,
  type RoomProductNeed,
  type TradeProject,
  type TradeProjectDetails,
  type TradeProjectItem,
  type TradeProjectRoomPlan,
  type TradeWorkspace,
} from "@/lib/trade-project";
import { createEmptyCustomRoomGroup, createEmptyRoomPlan } from "@/lib/trade-schedule";

interface TradeProjectContextValue {
  project: TradeProject;
  projects: TradeProject[];
  open: boolean;
  setOpen: (open: boolean) => void;
  addItem: (slug: string, finish: string, quantity?: number, meta?: Pick<TradeProjectItem, "scopeId" | "scopeName" | "scopeSummary">) => void;
  updateQuantity: (slug: string, finish: string, quantity: number, scopeId?: string) => void;
  removeItem: (slug: string, finish: string, scopeId?: string) => void;
  updateDetails: (details: Partial<TradeProjectDetails>) => void;
  newProject: () => void;
  switchProject: (id: string) => void;
  deleteProject: (id: string) => void;
  duplicateProject: (sourceId: string) => void;
  markSubmitted: (leadId: string) => void;
  clearProject: () => void;
  setRoomPlan: (plan: TradeProjectRoomPlan) => void;
  updateProductNeeds: (roomKey: string, productNeeds: RoomProductNeed[]) => void;
  addCustomRoom: (label: string, count: number) => string;
  removeCustomRoom: (roomKey: string) => void;
  addAllocation: (
    roomKey: string,
    roomCount: number,
    assignment: RoomGroupAssignment,
    rows: Array<{ slug: string; finish: string; quantity: number }>,
    scopeName: string,
    scopeSummary: string,
    label?: string
  ) => string;
  updateAllocation: (
    roomKey: string,
    allocationId: string,
    roomCount: number,
    assignment: RoomGroupAssignment,
    rows: Array<{ slug: string; finish: string; quantity: number }>,
    scopeName: string,
    scopeSummary: string,
    label?: string
  ) => void;
  removeAllocation: (roomKey: string, allocationId: string) => void;
  projectIconRef: React.RefObject<HTMLButtonElement | null>;
  flyToProject: (originEl: HTMLElement | null, image: string) => void;
  bump: number;
}

interface Flight {
  id: number;
  image: string;
  start: DOMRect;
  end: DOMRect;
}

const TradeProjectContext = createContext<TradeProjectContextValue | null>(null);

function freshWorkspace(): TradeWorkspace {
  const id = createProjectId();
  return { activeProjectId: id, projects: [createEmptyTradeProject(id)] };
}

export function TradeProjectProvider({ children }: { children: React.ReactNode }) {
  const [workspace, setWorkspace] = useState<TradeWorkspace>(() => ({
    activeProjectId: "",
    projects: [createEmptyTradeProject()],
  }));
  const [open, setOpen] = useState(false);
  const hydrated = useRef(false);
  const projectIconRef = useRef<HTMLButtonElement | null>(null);
  const flightId = useRef(0);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [bump, setBump] = useState(0);

  const flyToProject = useCallback((originEl: HTMLElement | null, image: string) => {
    if (!originEl || !projectIconRef.current) return;
    const start = originEl.getBoundingClientRect();
    const end = projectIconRef.current.getBoundingClientRect();
    const id = ++flightId.current;
    setFlights((f) => [...f, { id, image, start, end }]);
    window.setTimeout(() => {
      setFlights((f) => f.filter((item) => item.id !== id));
      setBump((b) => b + 1);
    }, 750);
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const storedWorkspace = window.localStorage.getItem(TRADE_WORKSPACE_STORAGE_KEY);
        const parsedWorkspace = storedWorkspace
          ? sanitizeTradeWorkspace(JSON.parse(storedWorkspace))
          : null;
        if (parsedWorkspace) {
          setWorkspace(parsedWorkspace);
        } else {
          const legacy = window.localStorage.getItem(TRADE_PROJECT_STORAGE_KEY);
          const parsedLegacy = legacy ? sanitizeTradeProject(JSON.parse(legacy)) : null;
          if (parsedLegacy) {
            const id = parsedLegacy.id || createProjectId();
            setWorkspace({ activeProjectId: id, projects: [{ ...parsedLegacy, id }] });
            window.localStorage.removeItem(TRADE_PROJECT_STORAGE_KEY);
          } else {
            setWorkspace(freshWorkspace());
          }
        }
      } catch {
        window.localStorage.removeItem(TRADE_WORKSPACE_STORAGE_KEY);
        setWorkspace(freshWorkspace());
      } finally {
        hydrated.current = true;
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!hydrated.current || !workspace.activeProjectId) return;
    window.localStorage.setItem(TRADE_WORKSPACE_STORAGE_KEY, JSON.stringify(workspace));
  }, [workspace]);

  useEffect(() => {
    function syncAcrossTabs(event: StorageEvent) {
      if (event.key !== TRADE_WORKSPACE_STORAGE_KEY || !event.newValue) return;
      try {
        const parsed = sanitizeTradeWorkspace(JSON.parse(event.newValue));
        if (parsed) setWorkspace(parsed);
      } catch {
        // Keep the current valid workspace if another tab writes malformed data.
      }
    }
    window.addEventListener("storage", syncAcrossTabs);
    return () => window.removeEventListener("storage", syncAcrossTabs);
  }, []);

  const project = useMemo(
    () => workspace.projects.find((entry) => entry.id === workspace.activeProjectId) ?? workspace.projects[0] ?? createEmptyTradeProject(),
    [workspace]
  );

  const updateActive = useCallback((update: (current: TradeProject) => TradeProject) => {
    setWorkspace((currentWorkspace) => {
      const activeId = currentWorkspace.activeProjectId || currentWorkspace.projects[0]?.id || createProjectId();
      const now = new Date().toISOString();
      const existing = currentWorkspace.projects.find((entry) => entry.id === activeId) ?? createEmptyTradeProject(activeId);
      const next = update(existing);
      const touched: TradeProject = {
        ...next,
        id: activeId,
        createdAt: next.createdAt || now,
        updatedAt: now,
        status: "draft",
      };
      const exists = currentWorkspace.projects.some((entry) => entry.id === activeId);
      return {
        activeProjectId: activeId,
        projects: exists
          ? currentWorkspace.projects.map((entry) => entry.id === activeId ? touched : entry)
          : [touched, ...currentWorkspace.projects],
      };
    });
  }, []);

  const addItem = useCallback((slug: string, finish: string, quantity = 1, meta?: Pick<TradeProjectItem, "scopeId" | "scopeName" | "scopeSummary">) => {
    updateActive((current) => {
      const existing = current.items.find((item) =>
        item.slug === slug &&
        item.finish === finish &&
        (item.scopeId || "") === (meta?.scopeId || "")
      );
      const items = existing
        ? current.items.map((item) => item === existing ? { ...item, quantity: Math.min(10_000, item.quantity + quantity) } : item)
        : [...current.items, {
          slug,
          finish,
          quantity: Math.max(1, quantity),
          scopeId: meta?.scopeId,
          scopeName: meta?.scopeName,
          scopeSummary: meta?.scopeSummary,
        }];
      return { ...current, items };
    });
  }, [updateActive]);

  const updateQuantity = useCallback((slug: string, finish: string, quantity: number, scopeId = "") => {
    updateActive((current) => ({
      ...current,
      items: current.items.map((item) => item.slug === slug && item.finish === finish
        && (item.scopeId || "") === scopeId
        ? { ...item, quantity: Math.max(1, Math.min(10_000, Math.round(quantity) || 1)) }
        : item),
    }));
  }, [updateActive]);

  const removeItem = useCallback((slug: string, finish: string, scopeId = "") => {
    updateActive((current) => ({
      ...current,
      items: current.items.filter((item) =>
        item.slug !== slug ||
        item.finish !== finish ||
        (item.scopeId || "") !== scopeId
      ),
    }));
  }, [updateActive]);

  const updateDetails = useCallback((details: Partial<TradeProjectDetails>) => {
    updateActive((current) => ({ ...current, details: { ...current.details, ...details } }));
  }, [updateActive]);

  const newProject = useCallback(() => {
    const id = createProjectId();
    setWorkspace((current) => ({
      activeProjectId: id,
      projects: [createEmptyTradeProject(id), ...current.projects].slice(0, 25),
    }));
    setOpen(true);
  }, []);

  const switchProject = useCallback((id: string) => {
    setWorkspace((current) => current.projects.some((entry) => entry.id === id)
      ? { ...current, activeProjectId: id }
      : current);
  }, []);

  const deleteProject = useCallback((id: string) => {
    setWorkspace((current) => {
      const projects = current.projects.filter((entry) => entry.id !== id);
      if (!projects.length) return freshWorkspace();
      return {
        projects,
        activeProjectId: current.activeProjectId === id ? projects[0].id : current.activeProjectId,
      };
    });
  }, []);

  const duplicateProject = useCallback((sourceId: string) => {
    setWorkspace((current) => {
      const source = current.projects.find((entry) => entry.id === sourceId);
      if (!source) return current;
      const newId = createProjectId();
      const now = new Date().toISOString();
      const duplicated: TradeProject = {
        ...source,
        id: newId,
        details: {
          ...source.details,
          projectName: source.details.projectName ? `${source.details.projectName} (copy)` : "",
        },
        roomPlan: source.roomPlan
          ? { ...source.roomPlan, groups: source.roomPlan.groups.map((group) => ({ ...group, allocations: group.allocations.map((a) => ({ ...a })) })) }
          : null,
        items: source.items.map((item) => ({ ...item })),
        createdAt: now,
        updatedAt: now,
        status: "draft",
        submittedLeadId: "",
      };
      return { activeProjectId: newId, projects: [duplicated, ...current.projects].slice(0, 25) };
    });
    setOpen(true);
  }, []);

  const markSubmitted = useCallback((leadId: string) => {
    setWorkspace((current) => ({
      ...current,
      projects: current.projects.map((entry) => entry.id === current.activeProjectId
        ? { ...entry, status: "submitted", submittedLeadId: leadId, updatedAt: new Date().toISOString() }
        : entry),
    }));
  }, []);

  const clearProject = useCallback(() => {
    updateActive((current) => createEmptyTradeProject(current.id));
  }, [updateActive]);

  const setRoomPlan = useCallback((plan: TradeProjectRoomPlan) => {
    updateActive((current) => ({ ...current, roomPlan: plan }));
  }, [updateActive]);

  const updateProductNeeds = useCallback((roomKey: string, productNeeds: RoomProductNeed[]) => {
    updateActive((current) => {
      const plan = current.roomPlan ?? createEmptyRoomPlan();
      return {
        ...current,
        roomPlan: {
          ...plan,
          groups: plan.groups.map((group) => group.roomKey === roomKey ? { ...group, productNeeds } : group),
        },
      };
    });
  }, [updateActive]);

  const addCustomRoom = useCallback((label: string, count: number) => {
    const roomKey = createCustomRoomKey();
    updateActive((current) => {
      const plan = current.roomPlan ?? createEmptyRoomPlan();
      const group = createEmptyCustomRoomGroup(roomKey, label.trim() || "Custom room", count);
      return { ...current, roomPlan: { ...plan, groups: [...plan.groups, group] } };
    });
    return roomKey;
  }, [updateActive]);

  const removeCustomRoom = useCallback((roomKey: string) => {
    updateActive((current) => {
      const plan = current.roomPlan ?? createEmptyRoomPlan();
      const group = plan.groups.find((entry) => entry.roomKey === roomKey);
      const scopeIds = new Set(
        [group?.scopeId, ...(group?.allocations.map((a) => a.scopeId) ?? [])].filter((id): id is string => Boolean(id))
      );
      return {
        ...current,
        items: current.items.filter((item) => !item.scopeId || !scopeIds.has(item.scopeId)),
        roomPlan: { ...plan, groups: plan.groups.filter((entry) => entry.roomKey !== roomKey) },
      };
    });
  }, [updateActive]);

  const addAllocation = useCallback((
    roomKey: string,
    roomCount: number,
    assignment: RoomGroupAssignment,
    rows: Array<{ slug: string; finish: string; quantity: number }>,
    scopeName: string,
    scopeSummary: string,
    label?: string
  ) => {
    const id = createAllocationId();
    const scopeId = `${roomKey}-alloc-${id}`;
    updateActive((current) => {
      const plan = current.roomPlan ?? createEmptyRoomPlan();
      return {
        ...current,
        items: [
          ...current.items,
          ...rows.map((row) => ({
            slug: row.slug,
            finish: row.finish,
            quantity: Math.max(1, Math.min(10_000, Math.round(row.quantity) || 1)),
            scopeId,
            scopeName,
            scopeSummary,
          })),
        ],
        roomPlan: {
          ...plan,
          groups: plan.groups.map((group) => group.roomKey === roomKey
            ? { ...group, allocations: [...group.allocations, { id, scopeId, roomCount: Math.max(1, Math.round(roomCount) || 1), assignment, label: label?.trim() || undefined }] }
            : group),
        },
      };
    });
    return id;
  }, [updateActive]);

  const updateAllocation = useCallback((
    roomKey: string,
    allocationId: string,
    roomCount: number,
    assignment: RoomGroupAssignment,
    rows: Array<{ slug: string; finish: string; quantity: number }>,
    scopeName: string,
    scopeSummary: string,
    label?: string
  ) => {
    updateActive((current) => {
      const plan = current.roomPlan ?? createEmptyRoomPlan();
      const group = plan.groups.find((entry) => entry.roomKey === roomKey);
      const scopeId = group?.allocations.find((a) => a.id === allocationId)?.scopeId ?? `${roomKey}-alloc-${allocationId}`;
      return {
        ...current,
        items: [
          ...current.items.filter((item) => item.scopeId !== scopeId),
          ...rows.map((row) => ({
            slug: row.slug,
            finish: row.finish,
            quantity: Math.max(1, Math.min(10_000, Math.round(row.quantity) || 1)),
            scopeId,
            scopeName,
            scopeSummary,
          })),
        ],
        roomPlan: {
          ...plan,
          groups: plan.groups.map((entry) => entry.roomKey === roomKey
            ? {
              ...entry,
              allocations: entry.allocations.map((a) => a.id === allocationId
                ? { ...a, roomCount: Math.max(1, Math.round(roomCount) || 1), assignment, label: label?.trim() || undefined }
                : a),
            }
            : entry),
        },
      };
    });
  }, [updateActive]);

  const removeAllocation = useCallback((roomKey: string, allocationId: string) => {
    updateActive((current) => {
      const plan = current.roomPlan ?? createEmptyRoomPlan();
      const group = plan.groups.find((entry) => entry.roomKey === roomKey);
      const allocation = group?.allocations.find((a) => a.id === allocationId);
      return {
        ...current,
        items: allocation ? current.items.filter((item) => item.scopeId !== allocation.scopeId) : current.items,
        roomPlan: {
          ...plan,
          groups: plan.groups.map((entry) => entry.roomKey === roomKey
            ? { ...entry, allocations: entry.allocations.filter((a) => a.id !== allocationId) }
            : entry),
        },
      };
    });
  }, [updateActive]);

  return (
    <TradeProjectContext.Provider value={{
      project,
      projects: workspace.projects,
      open,
      setOpen,
      addItem,
      updateQuantity,
      removeItem,
      updateDetails,
      newProject,
      switchProject,
      deleteProject,
      duplicateProject,
      markSubmitted,
      clearProject,
      setRoomPlan,
      updateProductNeeds,
      addCustomRoom,
      removeCustomRoom,
      addAllocation,
      updateAllocation,
      removeAllocation,
      projectIconRef,
      flyToProject,
      bump,
    }}>
      {children}
      <AnimatePresence>
        {flights.map((flight) => (
          <motion.div
            key={flight.id}
            initial={{
              left: flight.start.left,
              top: flight.start.top,
              width: flight.start.width,
              height: flight.start.height,
              opacity: 1,
              borderRadius: 20,
            }}
            animate={{
              left: flight.end.left + flight.end.width / 2 - 13,
              top: flight.end.top + flight.end.height / 2 - 13,
              width: 26,
              height: 26,
              opacity: [1, 1, 0],
              borderRadius: 999,
            }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            style={{ position: "fixed", zIndex: 200, overflow: "hidden", pointerEvents: "none" }}
          >
            <img src={flight.image} alt="" className="h-full w-full object-cover" />
          </motion.div>
        ))}
      </AnimatePresence>
    </TradeProjectContext.Provider>
  );
}

export function useTradeProject() {
  const value = useContext(TradeProjectContext);
  if (!value) throw new Error("useTradeProject must be used inside TradeProjectProvider");
  return value;
}
