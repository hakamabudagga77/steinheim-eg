"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { buildSearchIndex, searchIndex, type SearchResult } from "@/lib/search-index";

const SERIES_IDS = ["joy", "up", "art", "quatro"] as const;

export default function SiteSearch() {
  const t = useTranslations("siteSearch");
  const tNav = useTranslations("nav");
  const tWarranty = useTranslations("warranty");
  const tShipping = useTranslations("shippingPage");
  const tReturns = useTranslations("returnsPage");
  const tPrivacy = useTranslations("privacyPage");
  const tCollections = useTranslations("collections");
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const index = useMemo(() => {
    const pageLabels = {
      about: tNav("about"),
      contact: tNav("contact"),
      trade: tNav("trade"),
      warranty: tWarranty("title"),
      shipping: tShipping("title"),
      returns: tReturns("title"),
      privacy: tPrivacy("title"),
      projects: tNav("projects"),
    };

    const collectionDescriptions = Object.fromEntries(
      SERIES_IDS.map((id) => [id, tCollections(`${id}.description`)])
    );

    return buildSearchIndex(pageLabels, tNav("journal"), collectionDescriptions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const results = useMemo(() => searchIndex(index, query), [index, query]);

  const grouped = useMemo(() => {
    const groups: Record<SearchResult["kind"], SearchResult[]> = { product: [], collection: [], page: [] };
    for (const result of results) groups[result.kind].push(result);
    return groups;
  }, [results]);

  const flatResults = useMemo(
    () => [...grouped.product, ...grouped.collection, ...grouped.page],
    [grouped]
  );

  function closeSearch() {
    setOpen(false);
  }

  function go(result: SearchResult) {
    closeSearch();
    router.push(result.href);
  }

  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((current) => {
          const next = !current;
          if (next) {
            setQuery("");
            setActiveIndex(0);
          }
          return next;
        });
        return;
      }
      if (e.key === "Escape" && open) {
        closeSearch();
      }
    }
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [open]);

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  // Reset the highlighted result whenever the query changes, without a
  // setState-in-effect: compare against the previous query during render.
  const [prevQuery, setPrevQuery] = useState(query);
  if (query !== prevQuery) {
    setPrevQuery(query);
    setActiveIndex(0);
  }

  function handleListKeydown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flatResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = flatResults[activeIndex];
      if (target) go(target);
    }
  }

  // Deliberately not wrapped in AnimatePresence: selecting a result closes
  // this modal in the same tick as a route navigation, and Framer Motion's
  // exit-animation lifecycle can be interrupted by that concurrent
  // transition, leaving an invisible-but-still-pointer-events-auto backdrop
  // stuck over the whole page. A plain conditional render unmounts
  // synchronously the instant `open` flips false, which can never get
  // stuck; the entrance animation below is unaffected.
  if (!open) return null;

  return (
    <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
            onClick={closeSearch}
          />
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.25, ease: [0.22, 0.76, 0.2, 1] }}
            className="fixed inset-x-4 top-[10vh] z-[101] mx-auto max-w-[640px] overflow-hidden rounded-[14px] bg-white shadow-[0_40px_120px_rgba(0,0,0,0.35)] sm:inset-x-auto sm:left-1/2 sm:w-[640px] sm:-translate-x-1/2"
          >
            <div className="flex items-center gap-3 border-b border-charcoal/8 px-5 py-4">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0 text-charcoal/40">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleListKeydown}
                placeholder={t("placeholder")}
                className="min-w-0 flex-1 bg-transparent text-[15px] text-charcoal outline-none placeholder:text-charcoal/35"
              />
              <button
                type="button"
                onClick={closeSearch}
                className="flex h-7 w-7 shrink-0 items-center justify-center text-charcoal/40 transition hover:text-charcoal"
                aria-label={tNav("close")}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2" data-lenis-prevent>
              {query.trim() === "" ? (
                <p className="px-3 py-8 text-center text-[13px] text-charcoal/45">{t("hint")}</p>
              ) : flatResults.length === 0 ? (
                <p className="px-3 py-8 text-center text-[13px] text-charcoal/45">{t("noResults", { query })}</p>
              ) : (
                (["product", "collection", "page"] as const).map((kind) =>
                  grouped[kind].length === 0 ? null : (
                    <div key={kind} className="mb-1 last:mb-0">
                      <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-charcoal/35">
                        {t(`groups.${kind}`)}
                      </p>
                      {grouped[kind].map((result) => {
                        const flatIndex = flatResults.indexOf(result);
                        const active = flatIndex === activeIndex;
                        return (
                          <button
                            key={`${result.kind}-${result.href}`}
                            type="button"
                            onClick={() => go(result)}
                            onMouseEnter={() => setActiveIndex(flatIndex)}
                            className={`flex w-full items-center gap-3 rounded-[8px] px-3 py-2.5 text-start transition ${
                              active ? "bg-[#ece9e2]" : "hover:bg-[#ece9e2]/60"
                            }`}
                          >
                            {result.image ? (
                              <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-[6px] bg-[#ece9e2]">
                                <Image src={result.image} alt="" fill sizes="36px" className="object-contain p-1" />
                              </span>
                            ) : (
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] bg-[#ece9e2] text-[11px] font-medium text-charcoal/50">
                                {result.title.slice(0, 1)}
                              </span>
                            )}
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[14px] text-charcoal">{result.title}</span>
                              {result.subtitle && (
                                <span className="block truncate text-[11px] text-charcoal/45">{result.subtitle}</span>
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )
                )
              )}
            </div>

            <div className="hidden items-center gap-4 border-t border-charcoal/8 px-5 py-2.5 text-[10px] text-charcoal/35 sm:flex">
              <span className="flex items-center gap-1.5">
                <kbd className="rounded border border-charcoal/15 px-1.5 py-0.5 font-sans">↑↓</kbd>
                {t("navigateHint")}
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="rounded border border-charcoal/15 px-1.5 py-0.5 font-sans">Esc</kbd>
                {t("closeHint")}
              </span>
            </div>
          </motion.div>
    </>
  );
}
