"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  createEmptyTradeProject,
  createProjectId,
  sanitizeTradeProject,
  sanitizeTradeWorkspace,
  scopeIdForRoom,
  TRADE_PROJECT_STORAGE_KEY,
  TRADE_WORKSPACE_STORAGE_KEY,
  type RoomGroupAssignment,
  type RoomKey,
  type TradeProject,
  type TradeProjectDetails,
  type TradeProjectItem,
  type TradeProjectRoomPlan,
  type TradeWorkspace,
} from "@/lib/trade-project";
import { createEmptyRoomPlan } from "@/lib/trade-schedule";

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
  markSubmitted: (leadId: string) => void;
  clearProject: () => void;
  setRoomPlan: (plan: TradeProjectRoomPlan) => void;
  assignRoomGroup: (
    roomKey: RoomKey,
    assignment: RoomGroupAssignment,
    rows: Array<{ slug: string; finish: string; quantity: number }>,
    scopeName: string,
    scopeSummary: string
  ) => void;
  clearRoomGroupAssignment: (roomKey: RoomKey) => void;
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

  const assignRoomGroup = useCallback((
    roomKey: RoomKey,
    assignment: RoomGroupAssignment,
    rows: Array<{ slug: string; finish: string; quantity: number }>,
    scopeName: string,
    scopeSummary: string
  ) => {
    const scopeId = scopeIdForRoom(roomKey);
    updateActive((current) => {
      const plan = current.roomPlan ?? createEmptyRoomPlan();
      const nextItems = [
        ...current.items.filter((item) => item.scopeId !== scopeId),
        ...rows.map((row) => ({
          slug: row.slug,
          finish: row.finish,
          quantity: Math.max(1, Math.min(10_000, Math.round(row.quantity) || 1)),
          scopeId,
          scopeName,
          scopeSummary,
        })),
      ];
      return {
        ...current,
        items: nextItems,
        roomPlan: {
          ...plan,
          groups: plan.groups.map((group) => group.roomKey === roomKey ? { ...group, assignment } : group),
        },
      };
    });
  }, [updateActive]);

  const clearRoomGroupAssignment = useCallback((roomKey: RoomKey) => {
    const scopeId = scopeIdForRoom(roomKey);
    updateActive((current) => {
      const plan = current.roomPlan ?? createEmptyRoomPlan();
      return {
        ...current,
        items: current.items.filter((item) => item.scopeId !== scopeId),
        roomPlan: {
          ...plan,
          groups: plan.groups.map((group) => group.roomKey === roomKey ? { ...group, assignment: null } : group),
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
      markSubmitted,
      clearProject,
      setRoomPlan,
      assignRoomGroup,
      clearRoomGroupAssignment,
    }}>
      {children}
    </TradeProjectContext.Provider>
  );
}

export function useTradeProject() {
  const value = useContext(TradeProjectContext);
  if (!value) throw new Error("useTradeProject must be used inside TradeProjectProvider");
  return value;
}
