import { getAllProducts, getAllSeries, getSeriesById } from "@/lib/utils";
import { getProductDefaultImage } from "@/data/images";

export type SearchResultKind = "product" | "collection" | "page";

export interface SearchResult {
  kind: SearchResultKind;
  title: string;
  subtitle: string;
  href: string;
  image: string | null;
  /** Lowercased text this entry matches against; built once, reused per keystroke. */
  haystack: string;
}

// Static destinations that aren't in the product/collection data files.
// Labels are resolved through next-intl at search time (see buildSearchIndex),
// not hardcoded here, so results stay bilingual.
const STATIC_PAGES = [
  { key: "about", href: "/about" },
  { key: "contact", href: "/contact" },
  { key: "trade", href: "/trade" },
  { key: "warranty", href: "/warranty" },
  { key: "shipping", href: "/shipping" },
  { key: "returns", href: "/returns" },
  { key: "privacy", href: "/privacy" },
  { key: "projects", href: "/projects" },
] as const;

export function buildSearchIndex(
  pageLabels: Record<(typeof STATIC_PAGES)[number]["key"], string>,
  pageSubtitle: string,
  /** Localized one-line description per series id (collections.<id>.description) so
   *  Arabic queries actually match Arabic text, not the English-only data file copy. */
  collectionDescriptions: Record<string, string>
): SearchResult[] {
  const products = getAllProducts();
  const series = getAllSeries();

  const productResults: SearchResult[] = products.map((product) => {
    const seriesName = getSeriesById(product.series)?.name ?? product.series;
    return {
      kind: "product",
      title: product.name,
      subtitle: seriesName,
      href: `/products/${product.slug}`,
      image: getProductDefaultImage(product.slug),
      haystack: `${product.name} ${seriesName} ${product.type}`.toLowerCase(),
    };
  });

  const collectionResults: SearchResult[] = series.map((entry) => {
    const description = collectionDescriptions[entry.id] ?? "";
    return {
      kind: "collection",
      title: entry.name,
      subtitle: description,
      href: `/collections/${entry.id}`,
      image: null,
      haystack: `${entry.name} ${description}`.toLowerCase(),
    };
  });

  const pageResults: SearchResult[] = STATIC_PAGES.map((page) => ({
    kind: "page",
    title: pageLabels[page.key],
    subtitle: pageSubtitle,
    href: page.href,
    image: null,
    haystack: pageLabels[page.key].toLowerCase(),
  }));

  return [...productResults, ...collectionResults, ...pageResults];
}

/** Simple token-substring ranking: every query word must appear somewhere in the haystack. */
export function searchIndex(index: SearchResult[], query: string, limit = 8): SearchResult[] {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  return index
    .filter((entry) => terms.every((term) => entry.haystack.includes(term)))
    .slice(0, limit);
}
