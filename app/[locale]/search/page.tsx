import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import PageTransition from "@/components/layout/PageTransition";
import { buildSearchIndex, searchIndex, type SearchResult, type SearchResultKind } from "@/lib/search-index";
import { createLocalizedMetadata } from "@/lib/seo";

const SERIES_IDS = ["joy", "up", "art", "quatro"] as const;

const KIND_ORDER: SearchResultKind[] = ["product", "collection", "page"];

type SearchPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string | string[] }>;
};

export async function generateMetadata({ params, searchParams }: SearchPageProps) {
  const { locale } = await params;
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";
  const t = await getTranslations({ locale, namespace: "searchPage" });
  return createLocalizedMetadata({
    locale,
    path: "/search",
    title: query ? `${t("resultsFor", { query })} | Steinheim Egypt` : `${t("title")} | Steinheim Egypt`,
    description: t("hint"),
    // Search result pages are navigational aids, not indexable content.
    index: false,
  });
}

export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";

  const t = await getTranslations("searchPage");
  const tNav = await getTranslations("nav");
  const tCollections = await getTranslations("collections");

  // Mirrors the client modal's index (components/search/SiteSearch.tsx) so
  // this page returns exactly the same product/collection/page results.
  const index = buildSearchIndex(
    {
      about: tNav("about"),
      contact: tNav("contact"),
      trade: tNav("trade"),
      warranty: tNav("warranty"),
      shipping: tNav("shipping"),
      returns: tNav("returns"),
      privacy: tNav("privacy"),
      projects: tNav("projects"),
    },
    tNav("journal"),
    Object.fromEntries(SERIES_IDS.map((id) => [id, tCollections(`${id}.description`)])),
  );

  const results = query ? searchIndex(index, query, 100) : [];
  const grouped = KIND_ORDER.map((kind) => ({
    kind,
    items: results.filter((result) => result.kind === kind),
  })).filter((group) => group.items.length > 0);

  return (
    <PageTransition>
      <div className="bg-[#ece9e2] text-[#0a0a0a]">
        <section className="px-5 pb-16 pt-28 sm:px-8 lg:px-16 lg:pb-24 lg:pt-36">
          <div className="mx-auto max-w-[880px]">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-black/55">{t("title")}</p>
            <h1 className="mt-4 font-heading text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.05]" style={{ fontStyle: "italic" }}>
              {query ? t("resultsFor", { query }) : t("title")}
            </h1>

            <form action={`/${locale}/search`} method="get" className="mt-10">
              <div className="flex items-center gap-3 border border-black/12 bg-white px-5 py-4">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0 text-black/40">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-3.5-3.5" />
                </svg>
                <input
                  type="search"
                  name="q"
                  defaultValue={query}
                  placeholder={t("placeholder")}
                  aria-label={t("placeholder")}
                  className="min-w-0 flex-1 bg-transparent text-[15px] text-[#0a0a0a] outline-none placeholder:text-black/35"
                />
                <button
                  type="submit"
                  className="flex h-10 shrink-0 items-center rounded-full bg-[#0a0a0a] px-6 text-[11px] font-medium uppercase tracking-[0.15em] text-white transition hover:bg-black/80"
                >
                  {t("search")}
                </button>
              </div>
            </form>
          </div>
        </section>

        <section className="px-5 pb-24 sm:px-8 lg:px-16 lg:pb-32">
          <div className="mx-auto max-w-[880px]">
            {query === "" ? (
              <div className="border border-black/8 bg-white/60 px-6 py-16 text-center">
                <p className="text-[14px] leading-[1.7] text-black/55">{t("noQuery")}</p>
                <Link
                  href="/collections"
                  className="mt-8 inline-flex h-11 items-center rounded-full border border-black/15 px-7 text-[11px] font-medium uppercase tracking-[0.15em] text-black transition hover:border-black"
                >
                  {t("browseCollections")}
                </Link>
              </div>
            ) : results.length === 0 ? (
              <div className="border border-black/8 bg-white/60 px-6 py-16 text-center">
                <p className="font-heading text-[1.6rem] leading-tight" style={{ fontStyle: "italic" }}>
                  {t("noResults", { query })}
                </p>
                <p className="mt-3 text-[14px] leading-[1.7] text-black/55">{t("noResultsBody")}</p>
                <Link
                  href="/collections"
                  className="mt-8 inline-flex h-11 items-center rounded-full border border-black/15 px-7 text-[11px] font-medium uppercase tracking-[0.15em] text-black transition hover:border-black"
                >
                  {t("browseCollections")}
                </Link>
              </div>
            ) : (
              <>
                <p className="text-[12px] text-black/45">{t("resultCount", { count: results.length })}</p>
                <div className="mt-6 divide-y divide-black/8 border-y border-black/8">
                  {grouped.map((group) => (
                    <div key={group.kind} className="py-5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/55">
                        {t(`groups.${group.kind}`)}
                      </p>
                      <ul className="mt-3">
                        {group.items.map((result) => (
                          <SearchResultRow key={`${result.kind}-${result.href}`} result={result} />
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </PageTransition>
  );
}

function SearchResultRow({ result }: { result: SearchResult }) {
  return (
    <li>
      <Link href={result.href} className="group flex items-center gap-4 border-t border-black/6 py-3.5 transition hover:bg-white">
        {result.image ? (
          <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[6px] bg-[#ece9e2]">
            <Image src={result.image} alt="" fill sizes="48px" className="object-contain p-1" />
          </span>
        ) : (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[6px] bg-[#ece9e2] font-heading text-[15px] text-black/40">
            {result.title.slice(0, 1)}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-medium text-[#0a0a0a]">{result.title}</span>
          {result.subtitle && <span className="mt-0.5 block truncate text-[12px] text-black/50">{result.subtitle}</span>}
        </span>
        <span className="shrink-0 text-[20px] text-black/30 transition group-hover:translate-x-1 group-hover:text-black rtl:rotate-180 rtl:group-hover:-translate-x-1">
          →
        </span>
      </Link>
    </li>
  );
}
