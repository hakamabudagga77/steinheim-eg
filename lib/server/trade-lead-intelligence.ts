import "server-only";

import productsData from "@/data/products.json";
import { getProjectCompletion, type TradeProject } from "@/lib/trade-project";
import type { TradeLeadPriority, TradeLeadScope } from "@/lib/trade-leads";

function buildScopeBreakdown(
  rows: Array<{ item: TradeProject["items"][number]; variant: { price: number } }>
): TradeLeadScope[] {
  const map = new Map<string, TradeLeadScope>();
  for (const { item, variant } of rows) {
    const scopeId = item.scopeId || "manual";
    const existing = map.get(scopeId) ?? {
      scopeId,
      scopeName: item.scopeName || "Manually added products",
      scopeSummary: item.scopeSummary || "Products added directly from collection and product pages.",
      totalUnits: 0,
      retailReferenceTotal: 0,
      lineCount: 0,
    };
    existing.totalUnits += item.quantity;
    existing.retailReferenceTotal += item.quantity * variant.price;
    existing.lineCount += 1;
    map.set(scopeId, existing);
  }
  return Array.from(map.values());
}

export function analyzeProject(project: TradeProject) {
  const rows = project.items.flatMap((item) => {
    const product = productsData.products.find((entry) => entry.slug === item.slug);
    const variant = product?.variants.find((entry) => entry.finish === item.finish);
    return product && variant ? [{ item, variant }] : [];
  });
  const totalUnits = rows.reduce((sum, row) => sum + row.item.quantity, 0);
  const retailReferenceTotal = rows.reduce((sum, row) => sum + row.item.quantity * row.variant.price, 0);
  const completion = getProjectCompletion(project);
  const riskFlags = [
    !project.details.location && "Location missing",
    !project.details.timeline && "Required date missing",
    !project.details.phone && "Phone missing",
    !project.details.projectType && "Project type missing",
    totalUnits >= 50 && !project.details.notes && "Room mix / scope notes missing",
  ].filter((flag): flag is string => Boolean(flag));
  const scalePoints = totalUnits >= 250 ? 30 : totalUnits >= 100 ? 24 : totalUnits >= 25 ? 16 : totalUnits >= 5 ? 8 : 3;
  const score = Math.min(100, Math.round(20 + completion * 0.45 + scalePoints + (project.details.company ? 5 : 0)));
  const priority: TradeLeadPriority = score >= 78 || totalUnits >= 100 ? "hot" : score >= 55 ? "warm" : "exploratory";
  const scopeBreakdown = buildScopeBreakdown(rows);
  return { totalUnits, retailReferenceTotal, completion, riskFlags, score, priority, lineCount: rows.length, scopeBreakdown };
}
