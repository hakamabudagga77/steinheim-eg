export const COMPARISON_STORAGE_KEY = "steinheim-comparison-v1";
export const COMPARISON_MAX_ITEMS = 3;

export interface ComparisonItem {
  slug: string;
  finish: string;
}

export interface Comparison {
  items: ComparisonItem[];
  updatedAt: string;
}

export function createEmptyComparison(): Comparison {
  return { items: [], updatedAt: "" };
}

export function sanitizeComparison(value: unknown): Comparison | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Partial<Comparison>;
  if (!Array.isArray(source.items)) return null;
  const items = source.items.slice(0, COMPARISON_MAX_ITEMS).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const c = item as Partial<ComparisonItem>;
    if (typeof c.slug !== "string" || typeof c.finish !== "string") return [];
    return [{ slug: c.slug.slice(0, 120), finish: c.finish.slice(0, 60) }];
  });
  return {
    items,
    updatedAt: typeof source.updatedAt === "string" ? source.updatedAt : "",
  };
}
