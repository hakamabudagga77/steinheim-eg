"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import PageTransition from "@/components/layout/PageTransition";
import ScrollReveal from "@/components/ui/ScrollReveal";
import ProductCard from "@/components/product/ProductCard";
import ProductAssistantPanel, { type ProductPackageItem } from "@/components/product/ProductAssistantPanel";
import SpecTable from "@/components/product/SpecTable";
import { useTradeProject } from "@/components/catalogue/TradeProjectContext";
import { useCart } from "@/components/cart/CartContext";
import { getCollectionContextImage, getFinishDiscImage, getProductImage } from "@/data/images";
import { formatPrice, getFinishById, getProductBySlug, getProductsBySeries, getSeriesById } from "@/lib/utils";

const tabs = ["Description", "Product detail", "Customisation options", "Downloads"] as const;

const supportPackageTypes = ["accessories", "bidet-spray", "click-clack", "angle-valve"];

function packageTypesForProduct(type: string) {
  if (type === "free-standing") {
    return ["wall-mounted", "concealed-shower", "free-standing", ...supportPackageTypes];
  }
  if (type === "shower-column") {
    return ["basin-mixer", "shower-column", ...supportPackageTypes];
  }
  if (type === "wall-mounted") {
    return ["wall-mounted", "concealed-shower", ...supportPackageTypes];
  }
  if (type === "tall-basin-mixer") {
    return ["tall-basin-mixer", "concealed-shower", ...supportPackageTypes];
  }
  if (type === "concealed-shower") {
    return ["basin-mixer", "concealed-shower", ...supportPackageTypes];
  }
  if (supportPackageTypes.includes(type)) {
    return ["basin-mixer", "concealed-shower", type, ...supportPackageTypes];
  }
  return ["basin-mixer", "concealed-shower", ...supportPackageTypes];
}

type LiveVariantData = { finish: string; price: number; inventory: number; inStock: boolean };
type LiveProductData = { slug: string; variants: LiveVariantData[] } | null;

export default function ProductDetailClient({ slug, liveData = null }: { slug: string; liveData?: LiveProductData }) {
  const product = getProductBySlug(slug)!;
  const [selectedFinish, setSelectedFinish] = useState(product.variants[0].finish);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Description");
  const [cartAdded, setCartAdded] = useState(false);
  const { project, addItem, setOpen: setProposalOpen } = useTradeProject();
  const { addItem: addToCart } = useCart();

  const series = getSeriesById(product.series);
  const seriesName = series?.name ?? product.series;
  const variant = product.variants.find((entry) => entry.finish === selectedFinish) ?? product.variants[0];
  const finish = getFinishById(variant.finish);
  const liveVariant = liveData?.variants.find((v) => v.finish === variant.finish);
  const imageUrl = getProductImage(product.slug, variant.finish);
  const contextImage = getCollectionContextImage(product.series);
  const related = getProductsBySeries(product.series).filter((entry) => entry.slug !== product.slug).slice(0, 4);
  const isInProposal = project.items.some((item) => item.slug === product.slug && item.finish === variant.finish);
  const packageTypes = Array.from(new Set(packageTypesForProduct(product.type)));
  const packageBuild = (() => {
    const rows: ProductPackageItem[] = [];
    const omitted: string[] = [];
    const seriesProducts = getProductsBySeries(product.series);

    for (const type of packageTypes) {
      const packageProduct = type === product.type
        ? product
        : seriesProducts.find((entry) => entry.type === type);
      const packageVariant = packageProduct?.variants.find((entry) => entry.finish === variant.finish);

      if (!packageProduct || !packageVariant) {
        omitted.push(type.replace(/-/g, " "));
        continue;
      }

      rows.push({
        slug: packageProduct.slug,
        name: `${seriesName} ${packageProduct.name}`,
        finish: packageVariant.finish,
        model: packageVariant.model,
        quantity: type === "angle-valve" ? 2 : 1,
      });
    }

    return { rows, omitted };
  })();

  function addToProposal() {
    if (!isInProposal) addItem(product.slug, variant.finish);
    setProposalOpen(true);
  }

  function addPackageToProposal() {
    for (const item of packageBuild.rows) {
      addItem(item.slug, item.finish, item.quantity);
    }
    setProposalOpen(true);
  }

  return (
    <PageTransition>
      {/* Top: Image + Info */}
      <section className="bg-white pt-20">
        <div className="grid lg:grid-cols-[58%_42%]">
          {/* Left - product image with thumbnail strip */}
          <div className="relative flex h-[60svh] overflow-hidden bg-white lg:h-[75svh]">
            {/* Vertical thumbnails */}
            <div className="z-10 flex flex-col gap-2 py-4 pl-4 pr-1 sm:py-6 sm:pl-6 lg:py-8 lg:pl-8">
              {product.variants.slice(0, 5).map((entry) => {
                const thumbUrl = getProductImage(product.slug, entry.finish);
                return thumbUrl ? (
                  <button
                    key={entry.finish}
                    type="button"
                    onClick={() => setSelectedFinish(entry.finish)}
                    className={`relative h-[48px] w-[48px] shrink-0 overflow-hidden border transition sm:h-[56px] sm:w-[56px] ${
                      variant.finish === entry.finish
                        ? "border-charcoal"
                        : "border-border-light opacity-50 hover:opacity-100"
                    }`}
                  >
                    <Image src={thumbUrl} alt="" fill sizes="56px" className="object-contain p-1" />
                  </button>
                ) : null;
              })}
            </div>

            {/* Main image */}
            <div className="relative flex-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={variant.finish}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={`${seriesName} ${product.name} in ${finish?.name ?? variant.finish}`}
                      fill
                      priority
                      quality={90}
                      sizes="(max-width: 1024px) 100vw, 55vw"
                      className="object-contain p-[3%] lg:p-[5%]"
                    />
                  ) : (
                    <div className="font-heading text-3xl text-warm-gray/40">
                      {product.name}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Right - product info (compact, no tabs here) */}
          <div className="bg-white px-6 py-8 sm:px-10 lg:px-[7%] lg:py-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-warm-gray">
                Product detail
              </p>

              <h1 className="mt-3 font-heading text-[clamp(1.6rem,2.8vw,2.6rem)] leading-[1.1] text-charcoal">
                {product.name}
              </h1>

              <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.08em] text-warm-gray">
                Model {variant.model}
              </p>

              {/* Finishes */}
              <div className="mt-6">
                <p className="text-[10px] font-medium uppercase tracking-[0.17em] text-charcoal">
                  Finishes
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {product.variants.map((entry) => {
                    const entryFinish = getFinishById(entry.finish);
                    const disc = getFinishDiscImage(entry.finish);
                    return (
                      <button
                        key={entry.finish}
                        type="button"
                        onClick={() => setSelectedFinish(entry.finish)}
                        title={entryFinish?.name}
                        aria-label={`Select ${entryFinish?.name}`}
                        aria-pressed={variant.finish === entry.finish}
                        className={`relative h-9 w-9 overflow-hidden rounded-full border-2 transition ${
                          variant.finish === entry.finish
                            ? "border-charcoal scale-110"
                            : "border-transparent hover:border-warm-gray/40"
                        }`}
                      >
                        {disc ? (
                          <Image src={disc} alt="" fill sizes="36px" className="object-cover" />
                        ) : (
                          <span
                            className="absolute inset-0 rounded-full"
                            style={{ backgroundColor: entryFinish?.hex }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1.5 text-[12px] text-warm-gray">{finish?.name}</p>
              </div>

              {/* Price + Stock */}
              <div className="mt-6 border-t border-border-light pt-5">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-medium uppercase tracking-[0.17em] text-warm-gray">
                    Price
                  </p>
                  {liveVariant && (
                    <span className={`inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.1em] ${liveVariant.inStock ? "text-emerald-600" : "text-red-500"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${liveVariant.inStock ? "bg-emerald-500" : "bg-red-400"}`} />
                      {liveVariant.inStock ? "In stock" : "Out of stock"}
                    </span>
                  )}
                </div>
                <p className="mt-1.5 font-heading text-[24px] text-charcoal">
                  {formatPrice(liveVariant?.price ?? variant.price)}
                </p>
              </div>

              {/* CTAs - Add to cart (B2C) + Add to project (B2B) */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    addToCart(product.slug, variant.finish);
                    setCartAdded(true);
                    setTimeout(() => setCartAdded(false), 2200);
                  }}
                  className="flex h-[46px] items-center justify-center gap-2 bg-charcoal text-[10px] font-medium uppercase tracking-[0.14em] text-white transition hover:bg-black"
                >
                  {cartAdded ? "Added ✓" : "Add to cart"}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={addToProposal}
                  className="flex h-[46px] items-center justify-center gap-2 border border-charcoal/20 bg-white text-[10px] font-medium uppercase tracking-[0.14em] text-charcoal transition hover:border-charcoal"
                >
                  {isInProposal ? "View project ✓" : "Add to project"}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <ProductAssistantPanel
                product={product}
                series={series}
                variant={variant}
                finish={finish}
                isInProject={isInProposal}
                onAddToProject={addToProposal}
                packageItems={packageBuild.rows}
                omittedPackageItems={packageBuild.omitted}
                onAddPackage={addPackageToProposal}
              />
            </motion.div>
          </div>
        </div>
      </section>
      {/* Tabs section - full width, spans from image edge to button edge */}
      <section className="border-t border-border-light bg-white">
        <div className="px-6 sm:px-10 lg:px-[4%]">
          {/* Tab bar */}
          <div className="flex flex-wrap gap-1">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`shrink-0 border-b-2 px-3 sm:px-5 py-4 text-[11px] sm:text-[13px] font-medium tracking-[0.04em] transition ${
                  activeTab === tab
                    ? "border-charcoal text-charcoal"
                    : "border-transparent text-warm-gray hover:text-charcoal"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content - wider, with subtle bg */}
        <div className="border-t border-border-light bg-[#FAFAF8] px-6 py-10 sm:px-10 lg:px-[4%] lg:py-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="max-w-5xl"
            >
              {activeTab === "Description" && (
                <p className="text-[15px] leading-[1.9] text-stone">
                  {product.name} with hand shower. Sculptural form with precise engineering.
                  Part of the {seriesName} collection - {series?.description?.toLowerCase() || "designed for enduring performance"}.
                </p>
              )}
              {activeTab === "Product detail" && (
                <div className="border-t border-charcoal/10">
                  <SpecTable product={product} />
                </div>
              )}
              {activeTab === "Customisation options" && (
                <p className="text-[15px] leading-[1.9] text-stone">
                  Available in {product.variants.length} finish{product.variants.length > 1 ? "es" : ""}. Contact the trade team for project-specific configurations, custom finishes, and bulk pricing.
                </p>
              )}
              {activeTab === "Downloads" && (
                <div className="space-y-5">
                  <Link
                    href="/contact"
                    className="flex items-center gap-3 text-[14px] text-charcoal transition hover:text-warm-gray"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    Request specification sheet
                  </Link>
                  <p className="text-[13px] text-warm-gray">
                    CAD files and technical drawings available on request.
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
      {contextImage && (
        <section className="border-t border-border-light bg-[#FAFAF8] px-5 py-10 sm:px-8 sm:py-14 lg:px-10">
          <div className="mx-auto grid max-w-[1440px] gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <ScrollReveal>
              <div className="relative aspect-[16/10] overflow-hidden bg-charcoal">
                <Image
                  src={contextImage}
                  alt={`${seriesName} collection shown in a bathroom setting`}
                  fill
                  quality={90}
                  sizes="(max-width: 1024px) 100vw, 48vw"
                  className="object-cover"
                />
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.08} className="max-w-xl">
              <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-warm-gray">
                In context
              </p>
              <h2 className="mt-4 font-heading text-[clamp(2rem,4vw,3.6rem)] leading-[0.98] text-charcoal">
                The product belongs to a complete bathroom language.
              </h2>
              <p className="mt-5 text-[14px] leading-[1.9] text-warm-gray">
                See how the {seriesName} collection&apos;s form, finish, and proportions sit within a
                complete bathroom environment before choosing the exact specification.
              </p>
            </ScrollReveal>
          </div>
        </section>
      )}



      {/* Related products */}
      {related.length > 0 && (
        <section className="border-t border-border-light bg-white py-20 sm:py-28">
          <div className="mx-auto max-w-[1440px] px-[24px] lg:px-[40px]">
            <ScrollReveal className="mb-12 flex items-end justify-between">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-warm-gray">
                  Related products
                </p>
                <h2 className="mt-3 font-heading text-[clamp(1.8rem,3.5vw,2.8rem)]">
                  Continue the {seriesName} language.
                </h2>
              </div>
              <Link
                href={`/collections/${product.series}`}
                className="hidden text-[11px] font-medium uppercase tracking-[0.14em] text-charcoal transition hover:text-warm-gray sm:block"
              >
                View collection →
              </Link>
            </ScrollReveal>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
              {related.map((entry) => (
                <ProductCard key={entry.slug} product={entry} liveVariants={liveData?.slug === entry.slug ? liveData.variants : undefined} />
              ))}
            </div>
          </div>
        </section>
      )}
    </PageTransition>
  );
}
