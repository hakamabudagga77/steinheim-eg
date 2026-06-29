import type { TradeProject } from "@/lib/trade-project";

export const tradeLeadStatuses = ["new", "reviewing", "contacted", "quoted", "won", "lost"] as const;
export type TradeLeadStatus = (typeof tradeLeadStatuses)[number];
export type TradeLeadPriority = "hot" | "warm" | "exploratory";

export interface TradeLead {
  id: string;
  reference: string;
  submittedAt: string;
  updatedAt: string;
  source: string;
  locale: "en" | "ar";
  status: TradeLeadStatus;
  priority: TradeLeadPriority;
  score: number;
  completion: number;
  totalUnits: number;
  lineCount: number;
  retailReferenceTotal: number;
  riskFlags: string[];
  internalNotes: string;
  project: TradeProject;
}

export function isTradeLeadStatus(value: unknown): value is TradeLeadStatus {
  return typeof value === "string" && tradeLeadStatuses.includes(value as TradeLeadStatus);
}
