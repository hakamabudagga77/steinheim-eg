import type { TradeProject } from "@/lib/trade-project";

export const tradeLeadStatuses = [
  "new",
  "reviewing",
  "contacted",
  "quoted",
  "won",
  "in_production",
  "shipped",
  "delivered",
  "lost",
] as const;
export type TradeLeadStatus = (typeof tradeLeadStatuses)[number];
export type TradeLeadPriority = "hot" | "warm" | "exploratory";

// The happy-path progression shown to customers as a stage timeline.
// "lost" is a terminal branch, not a step on this line, so it's excluded.
export const TRADE_LEAD_JOURNEY_STAGES: TradeLeadStatus[] = [
  "new",
  "reviewing",
  "contacted",
  "quoted",
  "won",
  "in_production",
  "shipped",
  "delivered",
];

export const TRADE_LEAD_STATUS_LABELS: Record<TradeLeadStatus, string> = {
  new: "Received",
  reviewing: "Reviewing",
  contacted: "Contacted",
  quoted: "Quoted",
  won: "Confirmed",
  in_production: "Sourcing stock",
  shipped: "Shipped",
  delivered: "Delivered",
  lost: "Closed",
};

export const TRADE_LEAD_STATUS_COPY: Record<TradeLeadStatus, string> = {
  new: "Your project has been received and is queued for review.",
  reviewing: "The Steinheim team is reviewing your specification.",
  contacted: "The team has been in touch to confirm the details.",
  quoted: "A trade quote has been prepared for this project.",
  won: "Your order is confirmed and being prepared for dispatch.",
  in_production: "Steinheim is sourcing any additional stock needed for your order.",
  shipped: "Your order is on its way.",
  delivered: "Your order has been delivered.",
  lost: "This project is now closed.",
};

export interface TradeLeadScope {
  scopeId: string;
  scopeName: string;
  scopeSummary: string;
  totalUnits: number;
  retailReferenceTotal: number;
  lineCount: number;
}

export type TradeLeadMessageSender = "customer" | "steinheim";

export interface TradeLeadMessage {
  id: string;
  from: TradeLeadMessageSender;
  body: string;
  sentAt: string;
}

export interface TradeLeadSampleRequest {
  id: string;
  note: string;
  address: string;
  requestedAt: string;
  fulfilledAt?: string;
}

export interface TradeLeadDeliveryDetails {
  contactName: string;
  contactPhone: string;
  accessNotes: string;
  updatedAt: string;
}

export interface TradeLeadDocument {
  id: string;
  label: string;
  url: string;
  addedAt: string;
}

// Per-room-group status override. Kept separate from scopeBreakdown (which is
// fully regenerated from the cart every time the project is re-submitted) so a
// status set here survives the customer updating their selection.
export interface TradeLeadScopeStatus {
  scopeId: string;
  status: TradeLeadStatus;
}

// Snapshot of a quote's prior values, recorded whenever the admin changes an
// already-set quote — so a revision isn't just silently overwritten.
export interface TradeLeadQuoteRevision {
  url?: string;
  amount?: string;
  changedAt: string;
}

export interface TradeLead {
  id: string;
  reference: string;
  submittedAt: string;
  updatedAt: string;
  archivedAt?: string;
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
  scopeBreakdown: TradeLeadScope[];
  messages: TradeLeadMessage[];
  quoteUrl?: string;
  quoteAmount?: string;
  quoteAcceptedAt?: string;
  sampleRequests: TradeLeadSampleRequest[];
  deliveryDetails?: TradeLeadDeliveryDetails;
  documents: TradeLeadDocument[];
  scopeStatuses: TradeLeadScopeStatus[];
  quoteHistory: TradeLeadQuoteRevision[];
  warrantyReference?: string;
}

export function isTradeLeadStatus(value: unknown): value is TradeLeadStatus {
  return typeof value === "string" && tradeLeadStatuses.includes(value as TradeLeadStatus);
}
