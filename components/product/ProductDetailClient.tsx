"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import PageTransition from "@/components/layout/PageTransition";
import ProductCard from "@/components/product/ProductCard";
import ProductAssistantPanel, { type ProductPackageItem } from "@/components/product/ProductAssistantPanel";
import SpecTable from "@/components/product/SpecTable";
import { useTradeProject } from "@/components/catalogue/TradeProjectContext";
import { useCart } from "@/components/cart/CartContext";
import { getCollectionContextImage, getFinishDiscImage, getProductImage } from "@/data/images";
import { formatPrice, getFinishById, getProductBySlug, getProductsBySeries, getSeriesById } from "@/lib/utils";

const supportPackageTypes = ["accessories", "bidet-spray", "click-clack", "angle-valve"];

function packageTypesForProduct(type: string) {
  if (type === "free-standing") return ["wall-mounted", "concealed-shower", "free-standing", ...supportPackageTypes];
  if (type === "shower-column") return ["basin-mixer", "shower-column", ...supportPackageTypes];
  if (type === "wall-mounted") return ["wall-mounted", "concealed-shower", ...supportPackageTypes];
  if (type === "tall-basin-mixer") return ["tall-basin-mixer", "concealed-shower", ...supportPackageTypes];
  if (type === "concealed-shower") return ["basin-mixer", "concealed-shower", ...supportPackageTypes];
  if (supportPackageTypes.includes(type)) return ["basin-mixer", "concealed-shower", type, ...supportPackageTypes];
  return ["basin-mixer", "concealed-shower", ...supportPackageTypes];
}

type LiveVariantData = { finish: string; price: number; inventory: number; inStock: boolean };
type LiveProductData = { slug: string; variants: LiveVariantData[] } | null;

export default function ProductDetailClient({ slug, liveData = null }: { slug: string; liveData?: LiveProductData }) {
  const product = getProductBySlug(slug)!;
  const [selectedFinish, setSelectedFinish] = useState(product.variants[0].finish);
  const [expandedSpec, setExpandedSpec] = useState(false);
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
      const packageProduct = type === product.type ? product : seriesProducts.find((entry) => entry.type === type);
      const packageVariant = packageProduct?.variants.find((entry) => entry.finish === variant.finish);
      if (!packageProduct || !packageVariant) { omitted.push(type.replace(/-/g, " ")); continue; }
      rows.push({ slug: packageProduct.slug, name: `${seriesName} ${packageProduct.name}`, finish: packageVariant.finish, model: packageVariant.model, quantity: type === "angle-valve" ? 2 : 1 });
    }
    return { rows, omitted };
  })();

  function addToProposal() {
    if (!isInProposal) addItem(product.slug, variant.finish);
    setProposalOpen(true);
  }

  function addPackageToProposal() {
    for (const item of packageBuild.rows) addItem(item.slug, item.finish, item.quantity);
    setProposalOpen(true);
  }

  return (
    <PageTransition>
      <div className="bg-[#f3f1ed] text-[#111]">
        {/* Breadcrumb — Gessi style */}
        <div className="bg-[#f3f1ed] px-5 pt-[88px] pb-4 sm:px-8 lg:px-16 lg:pt-[96px]">
          <div className="mx-auto max-w-[1780px]">
            <p className="text-[12px] text-black/40">
              <Link href="/collections" className="hover:text-black transition">{seriesName}</Link>
              {" · "}
              <span className="text-black/60">{variant.model}</span>
            </p>
          </div>
        </div>

        {/* Main product section — Gessi split layout */}
        <section className="bg-[#f3f1ed] px-5 pb-0 sm:px-8 lg:px-16">
          <div className="mx-auto max-w-[1780px]">
            <div className="grid lg:grid-cols-[1.1fr_0.9fr] lg:gap-0">
              {/* Left — product image on warm beige, no rounded container (Gessi style) */}
              <div className="relative flex min-h-[55svh] items-center justify-center bg-[#ece9e2] lg:sticky lg:top-[80px] lg:min-h-[calc(100svh-80px)]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={variant.finish}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
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
                        className="object-contain p-[10%] lg:p-[12%]"
                      />
                    ) : (
                      <div className="font-heading text-3xl text-black/15">{product.name}</div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Right — product info panel (Gessi: model number as heading) */}
              <div className="py-10 lg:py-16 lg:pl-16">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.15 }}
                >
                  <h1 className="font-heading text-[clamp(2.4rem,5vw,4.5rem)] leading-[0.95] tracking-[-0.03em]">
                    {variant.model}
                  </h1>

                  <p className="mt-5 max-w-lg text-[15px] leading-[1.75] text-black/55">
                    {product.name}, {series?.description?.toLowerCase() || "designed for enduring performance and visual clarity."}
                  </p>

                  {/* Finish selector — Gessi row style: swatch circle + code – name */}
                  <div className="mt-10">
                    <div className="overflow-y-auto rounded-[14px] border border-black/10" style={{ maxHeight: "220px" }}>
                      {product.variants.map((entry, i) => {
                        const entryFinish = getFinishById(entry.finish);
                        const disc = getFinishDiscImage(entry.finish);
                        const active = variant.finish === entry.finish;
                        return (
                          <button
                            key={entry.finish}
                            type="button"
                            onClick={() => setSelectedFinish(entry.finish)}
                            className={`flex w-full items-center gap-4 px-5 py-4 text-left transition cursor-pointer hover:bg-black/[0.02] ${
                              i > 0 ? "border-t border-black/6" : ""
                            }`}
                          >
                            <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full">
                              {disc ? (
                                <Image src={disc} alt="" fill sizes="28px" className="object-cover" />
                              ) : (
                                <span className="absolute inset-0 rounded-full" style={{ backgroundColor: entryFinish?.hex }} />
                              )}
                            </span>
                            <span className={`text-[14px] ${active ? "font-semibold text-black" : "text-black/65"}`}>
                              {entry.model} – {entryFinish?.name}{entryFinish?.type === "pvd" ? " Pvd" : ""}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Add to Wishlist — Gessi primary CTA */}
                  <div className="mt-8">
                    <button
                      type="button"
                      onClick={() => {
                        addToCart(product.slug, variant.finish);
                        setCartAdded(true);
                        setTimeout(() => setCartAdded(false), 2200);
                      }}
                      className="flex h-[52px] w-full items-center justify-center rounded-full bg-black text-[13px] font-medium uppercase tracking-[0.08em] text-white transition hover:bg-black/85 cursor-pointer"
                    >
                      {cartAdded ? "Added to cart" : "Add to Wishlist"}
                    </button>
                  </div>

                  {/* Add to project — secondary */}
                  <button
                    type="button"
                    onClick={addToProposal}
                    className="mt-3 flex h-[44px] w-full items-center justify-center text-[12px] font-medium text-black/50 transition hover:text-black cursor-pointer"
                  >
                    {isInProposal ? "View project board" : "Add to project board"}
                  </button>

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

                  {/* Technical Features and Download — Gessi style */}
                  <div className="mt-6 border-t border-black/8">
                    <button
                      type="button"
                      onClick={() => setExpandedSpec(!expandedSpec)}
                      className="flex w-full items-center justify-between py-6 text-left cursor-pointer"
                    >
                      <span className="text-[14px] font-medium">Technical Features and Download</span>
                      <span className="text-[20px] text-black/40">{expandedSpec ? "−" : "+"}</span>
                    </button>
                    <AnimatePresence>
                      {expandedSpec && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="pb-8">
                            <SpecTable product={product} />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Context image */}
        {contextImage && (
          <section className="px-5 py-20 sm:px-8 lg:px-16 lg:py-28">
            <div className="mx-auto max-w-[1780px]">
              <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                <div className="relative aspect-[4/3] overflow-hidden rounded-[22px] bg-black">
                  <Image
                    src={contextImage}
                    alt={`${seriesName} collection in a bathroom setting`}
                    fill
                    quality={90}
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
                <div className="max-w-lg">
                  <p className="text-[12px] uppercase tracking-[0.34em] text-black/40">In context</p>
                  <h2 className="mt-4 text-[clamp(2rem,4vw,3.8rem)] font-normal leading-[0.95] tracking-[-0.04em]">
                    Part of a complete bathroom language.
                  </h2>
                  <p className="mt-5 text-[15px] leading-[1.85] text-black/50">
                    See how the {seriesName} collection&apos;s form, finish, and proportions work within a resolved bathroom environment.
                  </p>
                  <Link
                    href={`/collections/${product.series}`}
                    className="mt-8 inline-flex rounded-full border border-black/25 px-7 py-3 text-[13px] transition hover:bg-black hover:text-white"
                  >
                    View {seriesName} collection
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Related products */}
        {related.length > 0 && (
          <section className="border-t border-black/6 px-5 py-20 sm:px-8 lg:px-16 lg:py-28">
            <div className="mx-auto max-w-[1780px]">
              <div className="mb-14 flex items-end justify-between">
                <div>
                  <p className="text-[12px] uppercase tracking-[0.34em] text-black/40">Related</p>
                  <h2 className="mt-3 text-[clamp(2rem,4.5vw,4.4rem)] font-normal leading-[0.92] tracking-[-0.04em]">
                    Continue the {seriesName} language.
                  </h2>
                </div>
                <Link
                  href={`/collections/${product.series}`}
                  className="hidden rounded-full border border-black/25 px-7 py-3 text-[13px] transition hover:bg-black hover:text-white sm:inline-flex"
                >
                  View collection
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-5 md:grid-cols-4 md:gap-7">
                {related.map((entry) => (
                  <ProductCard key={entry.slug} product={entry} liveVariants={liveData?.slug === entry.slug ? liveData.variants : undefined} />
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </PageTransition>
  );
}
