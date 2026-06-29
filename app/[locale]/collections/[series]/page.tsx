"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { useTradeProject } from "@/components/catalogue/TradeProjectContext";
import CollectionAssistantPanel from "@/components/collections/CollectionAssistantPanel";
import ProductCard from "@/components/product/ProductCard";
import PageTransition from "@/components/layout/PageTransition";
import ScrollReveal from "@/components/ui/ScrollReveal";
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
  {
    headline: string;
    position: string;
    projectFit: string;
    specification: string;
    atmosphere: string;
  }
> = {
  joy: {
    headline: "The refined all-rounder for premium bathrooms.",
    position:
      "Joy is the collection to start with when the space needs to feel premium, warm, and easy to live with.",
    projectFit: "Homes, hotel rooms, premium apartments, family villas",
    specification: "Best when the brief asks for elegance without visual noise.",
    atmosphere: "Soft geometry, calm reflections, and a warm modern character.",
  },
  up: {
    headline: "A streamlined collection for repeatable modern projects.",
    position:
      "Up gives the bathroom a cleaner, more dynamic silhouette while staying practical for larger schedules.",
    projectFit: "Developments, interior designers, repeated unit schedules",
    specification: "Best when consistency and contemporary movement matter.",
    atmosphere: "Fluid transitions, slimmer profiles, and a quietly technical feel.",
  },
  art: {
    headline: "Architectural stainless steel for statement bathrooms.",
    position:
      "Art is for projects where the fitting should feel like part of the architecture, not an accessory.",
    projectFit: "Signature villas, suites, design-led hospitality, statement spaces",
    specification: "Best when the room needs stronger material presence.",
    atmosphere: "Sculptural, precise, confident, and intentionally more premium.",
  },
  quatro: {
    headline: "Geometric clarity for sharp modern interiors.",
    position:
      "Quatro brings defined edges and a more graphic silhouette to contemporary bathrooms.",
    projectFit: "Modern apartments, offices, villas, developer schemes",
    specification: "Best when the interior language is linear and architectural.",
    atmosphere: "Crisp geometry, clean planes, and controlled visual tension.",
  },
};

const starterPackageTypes = ["basin-mixer", "concealed-shower", "accessories", "bidet-spray", "click-clack", "angle-valve"];

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
      <div className="flex min-h-screen items-center justify-center pt-20 text-sm text-warm-gray">
        Collection not found.
      </div>
    );
  }

  const strategy = collectionStrategy[series.id];
  const startingPrice = getStartingPrice(products);
  const filtered = products.filter(
    (product) =>
      (typeFilter === "all" || product.type === typeFilter) &&
      (finishFilter === "all" || product.variants.some((variant) => variant.finish === finishFilter))
  );
  const packageFinishId = finishFilter !== "all" && series.finishes.includes(finishFilter)
    ? finishFilter
    : series.finishes[0];
  const packageFinish = finishes.find((finish) => finish.id === packageFinishId);
  const packageRows = starterPackageTypes.flatMap((type) => {
    const packageProduct = products.find((product) => product.type === type);
    const packageVariant = packageProduct?.variants.find((variant) => variant.finish === packageFinishId);
    if (!packageProduct || !packageVariant) return [];
    return [{
      slug: packageProduct.slug,
      name: `${series.name} ${packageProduct.name}`,
      finish: packageVariant.finish,
      model: packageVariant.model,
      quantity: type === "angle-valve" ? 2 : 1,
      price: packageVariant.price,
    }];
  });
  const omittedPackageItems = starterPackageTypes.flatMap((type) => {
    const packageProduct = products.find((product) => product.type === type);
    const packageVariant = packageProduct?.variants.find((variant) => variant.finish === packageFinishId);
    return packageProduct && packageVariant ? [] : [labelType(type)];
  });

  function addCollectionPackageToProject() {
    for (const row of packageRows) {
      addItem(row.slug, row.finish, row.quantity);
    }
    setProjectOpen(true);
  }

  return (
    <PageTransition>
      <section className="relative flex min-h-[78svh] items-end overflow-hidden bg-charcoal pt-20 text-white">
        <Image
          src={collectionBanners[series.id]}
          alt={`${series.name} bathroom collection`}
          fill
          priority
          sizes="100vw"
          quality={90}
          className="object-cover opacity-72"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-black/10" />
        <div className="relative z-10 mx-auto w-full max-w-[1600px] px-5 pb-12 sm:px-8 sm:pb-16 lg:px-10 lg:pb-20">
          <motion.div
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <p className="mb-5 text-[10px] font-medium uppercase tracking-[0.25em] text-white/55">
              Steinheim collection · Series {series.code}
            </p>
            <h1 className="font-heading text-[clamp(5rem,11vw,11rem)] leading-[0.76]">{series.name}</h1>
            <p className="mt-7 max-w-2xl font-heading text-[clamp(1.6rem,3vw,3.5rem)] leading-[1.05] text-white">
              {strategy?.headline}
            </p>
            <p className="mt-5 max-w-xl text-[15px] leading-[1.85] text-white/70">{strategy?.position}</p>
            <div className="mt-8 flex max-w-xl flex-wrap gap-3">
              {[
                [`${products.length}`, "Products"],
                [`${finishes.length}`, "Finishes"],
                [startingPrice > 0 ? formatPrice(startingPrice) : "-", "From"],
              ].map(([value, label]) => (
                <div key={label} className="min-w-[130px] border border-white/18 bg-black/18 px-4 py-3 backdrop-blur-sm">
                  <p className="font-heading text-[24px] leading-none text-white">{value}</p>
                  <p className="mt-2 text-[9px] uppercase tracking-[0.18em] text-white/45">{label}</p>
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[0.65fr_1.35fr]">
            <ScrollReveal>
              <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-warm-gray">
                Finish availability
              </p>
              <h2 className="mt-4 font-heading text-[clamp(1.8rem,3.4vw,3.4rem)] leading-[1.05] text-charcoal">
                Finish the collection before you finish the room.
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={0.08} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {finishes.map((finish) => {
                const disc = getFinishDiscImage(finish.id);
                return (
                  <button
                    key={finish.id}
                    type="button"
                    onClick={() => setFinishFilter(finish.id)}
                    className={`flex items-center gap-4 border p-4 text-left transition ${
                      finishFilter === finish.id
                        ? "border-charcoal bg-white"
                        : "border-border-light bg-white hover:border-charcoal/35"
                    }`}
                  >
                    <span className="relative h-12 w-12 overflow-hidden rounded-full border border-black/10">
                      {disc ? (
                        <Image src={disc} alt="" fill sizes="48px" className="object-cover" />
                      ) : (
                        <span className="absolute inset-0" style={{ backgroundColor: finish.hex }} />
                      )}
                    </span>
                    <span>
                      <span className="block text-[13px] text-charcoal">{finish.name}</span>
                      <span className="mt-1 block text-[10px] uppercase tracking-[0.14em] text-warm-gray">
                        Filter products
                      </span>
                    </span>
                  </button>
                );
              })}
            </ScrollReveal>
          </div>
        </div>
      </section>

      <section className="border-y border-border-light bg-white py-8">
        <div className="mx-auto grid max-w-[1600px] gap-6 px-5 sm:px-8 lg:grid-cols-2 lg:px-10">
          <div>
            <span className="text-[9px] font-medium uppercase tracking-[0.18em] text-warm-gray">Product type</span>
            <div className="mt-3 flex flex-wrap gap-2">
            {["all", ...types].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setTypeFilter(type)}
                className={`border px-4 py-2 text-[10px] font-medium uppercase tracking-[0.1em] transition ${
                  typeFilter === type
                    ? "border-charcoal bg-charcoal text-white"
                    : "border-border-light bg-white text-warm-gray hover:border-charcoal/30 hover:text-charcoal"
                }`}
              >
                {type === "all" ? "All" : labelType(type)}
              </button>
            ))}
            </div>
          </div>
          <div>
            <span className="text-[9px] font-medium uppercase tracking-[0.18em] text-warm-gray">Finish</span>
            <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setFinishFilter("all")}
              className={`border px-4 py-2 text-[10px] font-medium uppercase tracking-[0.1em] transition ${
                finishFilter === "all"
                  ? "border-charcoal bg-charcoal text-white"
                  : "border-border-light bg-white text-warm-gray hover:border-charcoal/30 hover:text-charcoal"
              }`}
            >
              All
            </button>
            {finishes.map((finish) => (
              <button
                key={finish.id}
                type="button"
                onClick={() => setFinishFilter(finish.id)}
                className={`border px-4 py-2 text-[10px] font-medium uppercase tracking-[0.1em] transition ${
                  finishFilter === finish.id
                    ? "border-charcoal bg-charcoal text-white"
                    : "border-border-light bg-white text-warm-gray hover:border-charcoal/30 hover:text-charcoal"
                }`}
              >
                {finish.name}
              </button>
            ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20 sm:py-28 lg:py-32">
        <div className="mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-10">
          <ScrollReveal className="mb-14 flex flex-col justify-between gap-6 border-b border-border-light pb-6 sm:flex-row sm:items-end">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-warm-gray">
                {series.name} products
              </p>
              <h2 className="mt-3 font-heading text-[clamp(2rem,4vw,3.8rem)] leading-none">
                Build the full bathroom language.
              </h2>
            </div>
            <div className="flex flex-wrap gap-3 text-[10px] uppercase tracking-[0.15em] text-warm-gray">
              <span>{filtered.length} products</span>
              <span>·</span>
              <button
                type="button"
                onClick={() => {
                  setTypeFilter("all");
                  setFinishFilter("all");
                }}
                className="hover:text-charcoal"
              >
                Reset filters
              </button>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-2 gap-x-4 gap-y-16 md:gap-x-6 lg:grid-cols-3 lg:gap-y-24">
            {filtered.map((product, index) => (
              <motion.div
                key={product.slug}
                initial={{ opacity: 0, y: 35 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: Math.min(index * 0.06, 0.24) }}
              >
                <ProductCard product={product} liveVariants={liveData[product.slug]?.variants} />
              </motion.div>
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="py-24 text-center text-sm text-warm-gray">No products match this combination.</p>
          )}
        </div>
      </section>

      <CollectionAssistantPanel
        series={series}
        products={products}
        finishes={finishes}
        strategy={strategy}
        packageRows={packageRows}
        omittedPackageItems={omittedPackageItems}
        packageFinishName={packageFinish?.name ?? packageFinishId}
        onAddPackage={addCollectionPackageToProject}
      />

      <section className="relative overflow-hidden border-t border-border-light bg-charcoal py-24 text-white sm:py-32 lg:py-40">
        <Image
          src={collectionBanners[series.id]}
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-15"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal/50 via-charcoal/30 to-charcoal/70" />
        <div className="relative z-10 mx-auto grid max-w-[1600px] gap-10 px-5 sm:px-8 lg:grid-cols-[1fr_auto] lg:items-center lg:px-10">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/45">
              Next step
            </p>
            <h2 className="mt-4 max-w-4xl font-heading text-[clamp(2.2rem,4.8vw,5rem)] leading-[0.95]">
              Add the pieces you like, then turn them into a project request.
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/collections"
              className="border border-white/25 bg-white/5 px-7 py-4 text-[11px] font-medium uppercase tracking-[0.16em] text-white backdrop-blur-sm transition hover:border-white hover:bg-white/10"
            >
              Compare collections
            </Link>
            <Link
              href="/trade"
              className="bg-white px-7 py-4 text-[11px] font-medium uppercase tracking-[0.16em] text-charcoal transition hover:bg-white/85"
            >
              Trade guidance
            </Link>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}

