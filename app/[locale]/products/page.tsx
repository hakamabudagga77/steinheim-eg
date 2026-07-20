"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import ProductCard from "@/components/product/ProductCard";
import PageTransition from "@/components/layout/PageTransition";
import { getFinishDiscImage } from "@/data/images";
import { getAllFinishes, getAllProducts, getAllSeries, getProductTypes, getSeriesById, type Product } from "@/lib/utils";

type LiveVariant = { finish: string; price: number; inventory: number; inStock: boolean };
type LiveData = Record<string, { variants: LiveVariant[] }>;
type SortOption = "featured" | "price-asc" | "price-desc" | "name-asc";

const TYPE_LABELS: Record<string, string> = {
  "basin-mixer": "Basin Mixers",
  "tall-basin-mixer": "Tall Basin Mixers",
  "wall-mounted": "Wall-Mounted Mixers",
  "concealed-shower": "Concealed Showers",
  "shower-column": "Shower Columns",
  "free-standing": "Free-Standing Mixers",
  accessories: "Accessories",
  "bidet-spray": "Bidet Sprays",
  "click-clack": "Click-Clack Wastes",
  "angle-valve": "Angle Valves",
};

const PRICE_BRACKETS = [
  { id: "under-3000", label: "Under EGP 3,000", min: 0, max: 3000 },
  { id: "3000-10000", label: "EGP 3,000 – 10,000", min: 3000, max: 10000 },
  { id: "10000-20000", label: "EGP 10,000 – 20,000", min: 10000, max: 20000 },
  { id: "20000-plus", label: "EGP 20,000+", min: 20000, max: Infinity },
] as const;

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name-asc", label: "Name: A–Z" },
];

function minPrice(product: Product, liveData: LiveData): number {
  const prices = product.variants.map(
    (v) => liveData[product.slug]?.variants.find((lv) => lv.finish === v.finish)?.price ?? v.price
  );
  return Math.min(...prices);
}

function anyInStock(product: Product, liveData: LiveData): boolean {
  const live = liveData[product.slug]?.variants;
  if (!live || live.length === 0) return true; // no live data yet — don't wrongly exclude
  return live.some((v) => v.inStock);
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-black/8 py-6">
      <p className="text-[11px] uppercase tracking-[0.25em] text-black/40">{title}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function CheckPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-4 py-2 text-left text-[13px] transition ${
        active ? "border-black bg-black text-white" : "border-black/15 text-black/65 hover:border-black/40 hover:text-black"
      }`}
    >
      {children}
    </button>
  );
}

export default function AllProductsPage() {
  const params = useParams();
  const isArabic = String(params.locale || "") === "ar";

  const allProducts = useMemo(() => getAllProducts(), []);
  const allSeries = useMemo(() => getAllSeries(), []);
  const allFinishes = useMemo(() => getAllFinishes(), []);
  const allTypes = useMemo(() => getProductTypes(), []);

  const [liveData, setLiveData] = useState<LiveData>({});
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("featured");
  const [selectedSeries, setSelectedSeries] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedFinishes, setSelectedFinishes] = useState<string[]>([]);
  const [priceBracket, setPriceBracket] = useState<string | null>(null);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/shopify/prices", { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : {}))
      .then(setLiveData)
      .catch((err) => {
        if (err.name !== "AbortError") console.error("Shopify pricing fetch failed:", err);
      });
    return () => controller.abort();
  }, []);

  function toggle(list: string[], value: string, setter: (v: string[]) => void) {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  const activeFilterCount =
    selectedSeries.length + selectedTypes.length + selectedFinishes.length + (priceBracket ? 1 : 0) + (inStockOnly ? 1 : 0);

  function clearAllFilters() {
    setSelectedSeries([]);
    setSelectedTypes([]);
    setSelectedFinishes([]);
    setPriceBracket(null);
    setInStockOnly(false);
  }

  const filtered = useMemo(() => {
    let list = allProducts;
    if (selectedSeries.length) list = list.filter((p) => selectedSeries.includes(p.series));
    if (selectedTypes.length) list = list.filter((p) => selectedTypes.includes(p.type));
    if (selectedFinishes.length) list = list.filter((p) => p.variants.some((v) => selectedFinishes.includes(v.finish)));
    if (priceBracket) {
      const bracket = PRICE_BRACKETS.find((b) => b.id === priceBracket);
      if (bracket) list = list.filter((p) => { const price = minPrice(p, liveData); return price >= bracket.min && price < bracket.max; });
    }
    if (inStockOnly) list = list.filter((p) => anyInStock(p, liveData));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (getSeriesById(p.series)?.name ?? "").toLowerCase().includes(q) ||
          (TYPE_LABELS[p.type] ?? p.type).toLowerCase().includes(q)
      );
    }
    return list;
  }, [allProducts, selectedSeries, selectedTypes, selectedFinishes, priceBracket, inStockOnly, search, liveData]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    if (sort === "price-asc") list.sort((a, b) => minPrice(a, liveData) - minPrice(b, liveData));
    else if (sort === "price-desc") list.sort((a, b) => minPrice(b, liveData) - minPrice(a, liveData));
    else if (sort === "name-asc") list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [filtered, sort, liveData]);

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#ece9e2] px-5 pb-24 pt-32 text-[#0a0a0a] sm:px-8 lg:px-16 lg:pt-40">
        <div className="mx-auto max-w-[1780px]">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <p className="text-[12px] uppercase tracking-[0.34em] text-black/40">Full range</p>
            <h1 className="mt-4 max-w-3xl font-heading text-[clamp(2.6rem,6vw,5.4rem)] font-normal leading-[0.95] tracking-[-0.05em]">
              All products.
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-[1.75] text-black/55">
              Every collection, every finish, in one place — {allProducts.length} products across Joy, Up, Art, and Quatro.
            </p>
          </motion.div>

          {/* Control bar */}
          <div className="sticky top-[76px] z-20 mt-10 flex flex-wrap items-center gap-3 border-y border-black/10 bg-[#ece9e2]/95 py-4 backdrop-blur-sm">
            <div className="flex w-full min-w-0 items-center gap-2 border border-black/15 px-4 py-2.5 sm:w-auto sm:flex-1">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="shrink-0 text-black/35">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products…"
                className="w-full min-w-0 bg-transparent text-[14px] outline-none placeholder:text-black/35"
              />
            </div>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="border border-black/15 bg-transparent px-4 py-2.5 text-[13px] outline-none"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  Sort: {opt.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="flex items-center gap-2 border border-black/15 px-4 py-2.5 text-[13px] transition hover:border-black"
            >
              Filters
              {activeFilterCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-black px-1 text-[10px] text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <p className="ml-auto shrink-0 text-[13px] text-black/40">{sorted.length} product{sorted.length === 1 ? "" : "s"}</p>
          </div>

          {/* Grid */}
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-32 text-center">
              <p className="text-[15px] text-black/50">No products match these filters.</p>
              <button type="button" onClick={clearAllFilters} className="rounded-full border border-black/20 px-6 py-2.5 text-[13px] transition hover:border-black">
                Clear all filters
              </button>
            </div>
          ) : (
            <motion.div layout className="mt-12 grid grid-cols-2 gap-10 md:gap-12 lg:grid-cols-3 lg:gap-y-20">
              {sorted.map((product, index) => (
                <motion.div
                  key={product.slug}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: Math.min(index * 0.03, 0.2) }}
                >
                  <ProductCard product={product} liveVariants={liveData[product.slug]?.variants} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Filters drawer */}
      <AnimatePresence>
        {filtersOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm"
              onClick={() => setFiltersOpen(false)}
            />
            <motion.aside
              initial={{ x: isArabic ? "-100%" : "100%" }}
              animate={{ x: 0 }}
              exit={{ x: isArabic ? "-100%" : "100%" }}
              transition={{ duration: 0.4, ease: [0.22, 0.76, 0.2, 1] }}
              className={`fixed bottom-0 top-0 z-[80] flex w-full max-w-[100vw] flex-col overflow-y-auto bg-white sm:max-w-[420px] ${
                isArabic ? "left-0" : "right-0"
              }`}
              dir={isArabic ? "rtl" : "ltr"}
            >
              <div className="flex items-center justify-between border-b border-black/10 px-6 py-5">
                <p className="text-[16px] font-medium">Filters</p>
                <button type="button" onClick={() => setFiltersOpen(false)} aria-label="Close filters" className="text-black/40 hover:text-black">
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.3">
                    <line x1="4" y1="4" x2="16" y2="16" />
                    <line x1="16" y1="4" x2="4" y2="16" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 px-6">
                <FilterSection title="Collection">
                  <div className="flex flex-wrap gap-2">
                    {allSeries.map((series) => (
                      <CheckPill key={series.id} active={selectedSeries.includes(series.id)} onClick={() => toggle(selectedSeries, series.id, setSelectedSeries)}>
                        {series.name}
                      </CheckPill>
                    ))}
                  </div>
                </FilterSection>

                <FilterSection title="Product type">
                  <div className="flex flex-wrap gap-2">
                    {allTypes.map((type) => (
                      <CheckPill key={type} active={selectedTypes.includes(type)} onClick={() => toggle(selectedTypes, type, setSelectedTypes)}>
                        {TYPE_LABELS[type] ?? type}
                      </CheckPill>
                    ))}
                  </div>
                </FilterSection>

                <FilterSection title="Finish">
                  <div className="flex flex-wrap gap-3">
                    {allFinishes.map((finish) => {
                      const active = selectedFinishes.includes(finish.id);
                      const disc = getFinishDiscImage(finish.id);
                      return (
                        <button
                          key={finish.id}
                          type="button"
                          onClick={() => toggle(selectedFinishes, finish.id, setSelectedFinishes)}
                          title={finish.name}
                          aria-pressed={active}
                          className="group flex flex-col items-center gap-2"
                        >
                          <span
                            className={`relative h-11 w-11 overflow-hidden rounded-full border-2 transition-all ${
                              active ? "scale-110 border-black shadow-[0_6px_18px_rgba(0,0,0,0.18)]" : "border-transparent group-hover:border-black/25"
                            }`}
                          >
                            {disc ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={disc} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <span className="absolute inset-0" style={{ backgroundColor: finish.hex }} />
                            )}
                          </span>
                          <span className={`text-[10px] uppercase tracking-[0.08em] ${active ? "font-medium text-black" : "text-black/40"}`}>
                            {finish.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </FilterSection>

                <FilterSection title="Price">
                  <div className="flex flex-col gap-2">
                    {PRICE_BRACKETS.map((bracket) => (
                      <CheckPill
                        key={bracket.id}
                        active={priceBracket === bracket.id}
                        onClick={() => setPriceBracket(priceBracket === bracket.id ? null : bracket.id)}
                      >
                        {bracket.label}
                      </CheckPill>
                    ))}
                  </div>
                </FilterSection>

                <FilterSection title="Availability">
                  <label className="flex cursor-pointer items-center justify-between">
                    <span className="text-[13px] text-black/70">In stock only</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={inStockOnly}
                      onClick={() => setInStockOnly((v) => !v)}
                      className={`relative h-6 w-11 rounded-full transition ${inStockOnly ? "bg-black" : "bg-black/15"}`}
                    >
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${inStockOnly ? "left-[22px]" : "left-0.5"}`} />
                    </button>
                  </label>
                </FilterSection>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-black/10 px-6 py-5">
                <button type="button" onClick={clearAllFilters} className="text-[13px] text-black/50 underline decoration-black/20 hover:text-black">
                  Clear all
                </button>
                <button
                  type="button"
                  onClick={() => setFiltersOpen(false)}
                  className="rounded-full bg-black px-8 py-3 text-[13px] font-medium text-white transition hover:bg-black/85"
                >
                  Show {sorted.length} product{sorted.length === 1 ? "" : "s"}
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
