import type { Finish, Product, Variant } from "@/lib/utils";
import type { TradeLeadDeliveryDetails, TradeLeadDocument, TradeLeadQuoteRevision, TradeLeadSampleRequest, TradeLeadScopeStatus, TradeLeadStatus } from "@/lib/trade-leads";
import type { TradeProjectItem } from "@/lib/trade-project";

export type DrawerStep = "board" | "details" | "sent" | "messages" | "status" | "quote" | "samples" | "documents";

export interface Row {
  item: TradeProjectItem;
  product: Product;
  variant: Variant;
  finish: Finish | undefined;
}

export interface ScopeGroup {
  id: string;
  name: string;
  summary: string;
  rows: Row[];
  totalUnits: number;
  totalValue: number;
}

export interface RelatedProject {
  id: string;
  reference: string;
  projectName: string;
  status: TradeLeadStatus;
  submittedAt: string;
}

export interface LeadOverview {
  status: TradeLeadStatus;
  quoteUrl?: string;
  quoteAmount?: string;
  quoteAcceptedAt?: string;
  quoteHistory: TradeLeadQuoteRevision[];
  sampleRequests: TradeLeadSampleRequest[];
  deliveryDetails?: TradeLeadDeliveryDetails;
  documents: TradeLeadDocument[];
  scopeStatuses: TradeLeadScopeStatus[];
  warrantyReference?: string;
  relatedProjects: RelatedProject[];
}

export function formatSampleDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
