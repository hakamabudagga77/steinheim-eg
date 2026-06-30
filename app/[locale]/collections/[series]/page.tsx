"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { useTradeProject } from "@/components/catalogue/TradeProjectContext";
import ProductCard from "@/components/product/ProductCard";
import PageTransition from "@/components/layout/PageTransition";
import { collectionBanners, getFinishDiscImage } from "@/data/images";
import {
  formatPrice,
  getAllFinishes,
  getProductsBySeries,
  getSeriesById,
  type Product,
} from "@/lib/utils";

const collectionStrategy: Record<
  string,
  { headline: string; position: string; atmosphere: string }
> = {
  joy: {
    headline: "The refined all-rounder for premium bathrooms.",
    position:
      "Joy is the collection to start with when the space needs to feel premium, warm, and easy to live with.",
    atmosphere: "Soft geometry, calm reflections, and a warm modern character.",
  },
  up: {
    headline: "A streamlined collection for repeatable modern projects.",
    position:
      "Up gives the bathroom a cleaner, more dynamic silhouette while staying practical for larger schedules.",
    atmosphere: "Fluid transitions, slimmer profiles, and a quietly technical feel.",
  },
  art: {
    headline: "Architectural stainless steel for statement bathrooms.",
    position:
      "Art is for projects where the fitting should feel like part of the architecture, not an accessory.",
    atmosphere: "Sculptural, precise, confident, and intentionally more premium.",
  },
  quatro: {
    headline: "Geometric clarity for sharp modern interiors.",
    position:
      "Quatro brings defined edges and a more graphic silhouette to contemporary bathrooms.",
    atmosphere: "Crisp geometry, clean planes, and controlled visual tension.",
  },
};

function labelType(value: string) {
  return value.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getStartingPrice(products: Product[]) {
  const prices = products.flatMap((product) => product.variants.map((variant) => variant.price));
  return prices.length ? Math.min(...prices) : 0;
}

export default function CollectionPage() {
  const params = useParams();
  const seriesId = String(params.series || "");
  const series = getSeriesById(seriesId);
  const products = getProductsBySeries(seriesId);
  const finishes = getAllFinishes().filter((finish) => series?.finishes.includes(finish.id));
  const types = useMemo(() => Array.from(new Set(products.map((product) => product.type))), [products]);
  const [typeFilter, setTypeFilter] = useState("all");
  const [finishFilter, setFinishFilter] = useState("all");
  const { addItem, setOpen: setProjectOpen } = useTradeProject();
  const [liveData, setLiveData] = useState<Record<string, { variants: Array<{ finish: string; price: number; inventory: number; inStock: boolean }> }>>({});

  useEffect(() => {
    fetch("/api/shopify/prices")
      .then((r) => r.ok ? r.json() : {})
      .then(setLiveData)
      .catch(() => {});
  }, []);

  if (!series) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-20 text-sm text-black/40">
        Collection not found.
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState<"overview" | "products">("products");
  const strategy = collectionStrategy[series.id];
  const startingPrice = getStartingPrice(products);
  const filtered = products.filter(
    (product) =>
      (typeFilter === "all" || product.type === typeFilter) &&
      (finishFilter === "all" || product.variants.some((variant) => variant.finish === finishFilter))
  );

  return (
    <PageTransition>
      <div className="bg-[#f3f1ed] text-[#111]">
        {/* Cinematic Hero — Gessi: huge italic serif name on dark bg */}
        <section className="relative flex min-h-[80svh] items-center justify-center overflow-hidden bg-black pt-20 text-white">
          <Image
            src={collectionBanners[series.id]}
            alt={`${series.name} bathroom collection`}
            fill
            priority
            sizes="100vw"
            quality={90}
            className="object-cover opacity-45"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-black/20" />
          {/* Breadcrumb — Gessi style top-left */}
          <div className="absolute top-[88px] left-0 right-0 z-10 px-5 sm:px-8 lg:top-[96px] lg:px-16">
            <div className="mx-auto max-w-[1780px]">
              <p className="text-[11px] text-white/40">
                <Link href="/" className="hover:text-white/70 transition">Home</Link>
                {" > "}
                <Link href="/collections" className="hover:text-white/70 transition">Collections</Link>
                {" > "}
                <span className="text-white/60">{series.name}</span>
              </p>
            </div>
          </div>
          <div className="relative z-10 text-center">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 0.76, 0.2, 1] }}
              className="font-heading text-[clamp(5rem,14vw,13rem)] uppercase leading-[0.82] tracking-[-0.02em]"
              style={{ fontStyle: "italic" }}
            >
              {series.name}
            </motion.h1>
          </div>
        </section>

        {/* Sub-nav tabs — Gessi: Overview / Catalogue / Products */}
        <section className="sticky top-[72px] z-30 border-b border-black/8 bg-[#f3f1ed] px-5 sm:px-8 lg:top-[80px] lg:px-16">
          <div className="mx-auto flex max-w-[1780px] items-center justify-between py-4">
            <p className="text-[14px] font-medium">{series.name}</p>
            <div className="flex gap-1">
              {(["overview", "products"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-full px-5 py-2 text-[12px] font-medium capitalize transition cursor-pointer ${
                    activeTab === tab
                      ? "bg-black text-white"
                      : "text-black/50 hover:bg-black/5 hover:text-black"
                  }`}
                >
                  {tab === "overview" ? "Overview" : "Products"}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Overview tab content */}
        {activeTab === "overview" && (
          <>
            <section className="px-5 py-20 sm:px-8 lg:px-16 lg:py-28">
              <div className="mx-auto max-w-[1780px]">
                <div className="grid gap-16 lg:grid-cols-2">
                  <div>
                    <p className="max-w-xl font-heading text-[clamp(2rem,4vw,3.4rem)] leading-[1.1]">
                      {strategy?.headline}
                    </p>
                    <p className="mt-6 max-w-lg text-[15px] leading-[1.85] text-black/55">
                      {strategy?.position}
                    </p>
                    <p className="mt-4 max-w-lg text-[15px] leading-[1.85] text-black/45">
                      {strategy?.atmosphere}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-10">
                    {[
                      [String(products.length), "Products"],
                      [String(finishes.length), "Finishes"],
                      [startingPrice > 0 ? formatPrice(startingPrice) : "—", "Starting from"],
                    ].map(([value, label]) => (
                      <div key={label}>
                        <p className="font-heading text-[28px] leading-none">{value}</p>
                        <p className="mt-2 text-[11px] uppercase tracking-[0.25em] text-black/40">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Available finishes */}
            <section className="px-5 pb-20 sm:px-8 lg:px-16 lg:pb-28">
              <div className="mx-auto max-w-[1780px]">
                <p className="mb-8 text-[12px] uppercase tracking-[0.34em] text-black/40">Available finishes</p>
                <div className="flex flex-wrap gap-3">
                  {finishes.map((finish) => {
                    const disc = getFinishDiscImage(finish.id);
                    return (
                      <div key={finish.id} className="flex items-center gap-3 rounded-full border border-black/10 bg-white px-5 py-3">
                        <span className="relative h-7 w-7 overflow-hidden rounded-full">
                          {disc ? (
                            <Image src={disc} alt="" fill sizes="28px" className="object-cover" />
                          ) : (
                            <span className="absolute inset-0 rounded-full" style={{ backgroundColor: finish.hex }} />
                          )}
                        </span>
                        <span className="text-[13px] font-medium">{finish.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            <div className="px-5 pb-20 text-center sm:px-8 lg:px-16 lg:pb-28">
              <button
                type="button"
                onClick={() => setActiveTab("products")}
                className="rounded-full bg-black px-10 py-4 text-[13px] font-medium text-white transition hover:bg-black/85 cursor-pointer"
              >
                View products
              </button>
            </div>
          </>
        )}

        {/* Products tab content */}
        {activeTab === "products" && (
          <>
            {/* Finish filter */}
            <section className="px-5 pt-10 sm:px-8 lg:px-16 lg:pt-14">
              <div className="mx-auto max-w-[1780px]">
                <div className="flex flex-wrap items-center gap-3">
                  {finishes.map((finish) => {
                    const disc = getFinishDiscImage(finish.id);
                    const active = finishFilter === finish.id;
                    return (
                      <button
                        key={finish.id}
                        type="button"
                        onClick={() => setFinishFilter(active ? "all" : finish.id)}
                        className={`flex items-center gap-3 rounded-full border px-5 py-3 transition cursor-pointer ${
                          active
                            ? "border-black bg-black text-white"
                            : "border-black/12 bg-white text-black/70 hover:border-black/30"
                        }`}
                      >
                        <span className="relative h-6 w-6 overflow-hidden rounded-full">
                          {disc ? (
                            <Image src={disc} alt="" fill sizes="24px" className="object-cover" />
                          ) : (
                            <span className="absolute inset-0" style={{ backgroundColor: finish.hex }} />
                          )}
                        </span>
                        <span className="text-[12px] font-medium">{finish.name}</span>
                      </button>
                    );
                  })}
                  {finishFilter !== "all" && (
                    <button
                      type="button"
                      onClick={() => setFinishFilter("all")}
                      className="rounded-full border border-black/15 px-5 py-3 text-[12px] text-black/50 transition hover:border-black hover:text-black cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* Type filter */}
            <section className="px-5 pt-6 sm:px-8 lg:px-16">
              <div className="mx-auto max-w-[1780px] border-b border-black/8 pb-8">
                <div className="flex flex-wrap gap-2">
                  {["all", ...types].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setTypeFilter(type)}
                      className={`rounded-full border px-5 py-2 text-[12px] font-medium transition cursor-pointer ${
                        typeFilter === type
                          ? "border-black bg-black text-white"
                          : "border-black/10 bg-white text-black/55 hover:border-black/25 hover:text-black"
                      }`}
                    >
                      {type === "all" ? "All" : labelType(type)}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Product grid — Gessi: collection name + model number */}
            <section className="px-5 py-16 sm:px-8 lg:px-16 lg:py-20">
              <div className="mx-auto max-w-[1780px]">
                <div className="grid grid-cols-2 gap-5 md:gap-7 lg:grid-cols-3 lg:gap-y-16">
                  {filtered.map((product, index) => (
                    <motion.div
                      key={product.slug}
                      initial={{ opacity: 0, y: 28 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-60px" }}
                      transition={{ duration: 0.55, delay: Math.min(index * 0.05, 0.2) }}
                    >
                      <ProductCard product={product} liveVariants={liveData[product.slug]?.variants} hidePrice />
                    </motion.div>
                  ))}
                </div>

                {filtered.length === 0 && (
                  <div className="flex flex-col items-center py-24 text-center">
                    <p className="text-[15px] text-black/40">No products match this combination.</p>
                    <button
                      type="button"
                      onClick={() => { setTypeFilter("all"); setFinishFilter("all"); }}
                      className="mt-4 rounded-full border border-black/20 px-6 py-2.5 text-[13px] transition hover:bg-black hover:text-white cursor-pointer"
                    >
                      Reset filters
                    </button>
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {/* CTA — Gessi-style service strip */}
        <section className="border-t border-black/8 px-5 py-20 sm:px-8 lg:px-16">
          <div className="mx-auto grid max-w-[1780px] lg:grid-cols-3">
            {[
              ["Explore more collections", "Compare all four Steinheim collections and find the right mood for your project.", "/collections"],
              ["Project studio", "Build a trade scope and prepare a complete Steinheim specification.", "/trade"],
              ["Get assistance", "Request pricing, lead times, and project-specific guidance.", "/contact"],
            ].map(([title, body, href]) => (
              <Link
                key={title}
                href={href}
                className="group flex min-h-[160px] items-center justify-between gap-6 border-b border-black/8 px-6 py-8 transition hover:bg-white lg:border-b-0 lg:border-r lg:last:border-r-0 lg:px-10"
              >
                <span>
                  <span className="block text-[20px] font-medium">{title}</span>
                  <span className="mt-3 block max-w-sm text-[14px] leading-[1.65] text-black/50">{body}</span>
                </span>
                <span className="text-[32px] text-black/25 transition group-hover:translate-x-2 group-hover:text-black">→</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
