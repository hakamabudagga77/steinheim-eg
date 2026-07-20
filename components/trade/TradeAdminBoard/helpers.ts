import type { BadgeTone } from "@/components/admin/ui";
import type { TradeLead } from "@/lib/trade-leads";

export function priorityTone(priority: TradeLead["priority"]): BadgeTone {
  if (priority === "hot") return "danger";
  if (priority === "warm") return "warning";
  return "neutral";
}

export function formatDate(value: string) {
  return new Date(value).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
