"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import PageTransition from "@/components/layout/PageTransition";
import ProductCard from "@/components/product/ProductCard";
import SpecTable from "@/components/product/SpecTable";
import { useTradeProject } from "@/components/catalogue/TradeProjectContext";
import { useCart } from "@/components/cart/CartContext";
import { useWishlist } from "@/components/wishlist/WishlistContext";
import { getCollectionContextImage, getFinishDiscImage, getProductImage } from "@/data/images";
import { getFinishById, getProductBySlug, getProductsBySeries, getSeriesById } from "@/lib/utils";

type LiveVariantData = { finish: string; price: number; inventory: number; inStock: boolean };
type LiveProductData = { slug: string; variants: LiveVariantData[] } | null;

export default function ProductDetailClient({ slug, liveData = null }: { slug: string; liveData?: LiveProductData }) {
  const product = getProductBySlug(slug)!;
  const [selectedFinish, setSelectedFinish] = useState(product.variants[0].finish);
  const [finishOpen, setFinishOpen] = useState(false);
  const [expandedSpec, setExpandedSpec] = useState(false);
  const [cartAdded, setCartAdded] = useState(false);
  const { project, addItem, setOpen: setProposalOpen } = useTradeProject();
  const { addItem: addToCart } = useCart();
  const { toggleItem: toggleWishlist, isInWishlist } = useWishlist();

  const series = getSeriesById(product.series);
  const seriesName = series?.name ?? product.series;
  const variant = product.variants.find((entry) => entry.finish === selectedFinish) ?? product.variants[0];
  const finish = getFinishById(variant.finish);
  const imageUrl = getProductImage(product.slug, variant.finish);
  const isBasinRelated = product.type.includes("basin") || product.name.toLowerCase().includes("basin");
  const contextImage = isBasinRelated ? "/images/generated/gessi/product-context-basin.png" : getCollectionContextImage(product.series);
  const related = getProductsBySeries(product.series).filter((entry) => entry.slug !== product.slug).slice(0, 4);
  const isInProposal = project.items.some((item) => item.slug === product.slug && item.finish === variant.finish);
  const activeFinishDisc = getFinishDiscImage(variant.finish);

  function addToProposal() {
    if (!isInProposal) addItem(product.slug, variant.finish);
    setProposalOpen(true);
  }

  return (
    <PageTransition>
      <div className="bg-[#ece9e2] text-[#0a0a0a]">
        <div className="bg-[#ece9e2] px-5 pb-4 pt-[92px] sm:px-8 lg:px-16 lg:pt-[104px]">
          <div className="mx-auto max-w-[1780px]">
            <p className="text-[12px] text-black/40">
              <Link href={`/collections/${product.series}`} className="transition hover:text-black">
                {seriesName}
              </Link>
              {" · "}
              <span className="text-black/60">{variant.model}</span>
            </p>
          </div>
        </div>

        <section className="bg-[#ece9e2]">
          <div className="grid min-h-[calc(100svh-124px)] lg:grid-cols-[56vw_44vw]">
            <div className="relative flex min-h-[58svh] items-center justify-center overflow-hidden bg-[#ece9e2] lg:sticky lg:top-[80px] lg:min-h-[calc(100svh-80px)]">
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
                      quality={92}
                      sizes="(max-width: 1024px) 100vw, 56vw"
                      className="scale-[1.16] object-contain p-[4%] transition duration-[900ms] lg:scale-[1.24] lg:p-[5%]"
                    />
                  ) : (
                    <div className="font-heading text-3xl text-black/15">{product.name}</div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex items-center px-5 py-12 sm:px-8 lg:px-16 lg:py-20 xl:px-20">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="w-full max-w-[620px]"
              >
                <p className="text-[17px] text-black/82">{seriesName} Collection</p>
                <h1 className="mt-6 font-heading text-[clamp(3.2rem,5.8vw,5.8rem)] font-light leading-[0.9] tracking-[-0.055em]">
                  {variant.model}
                </h1>

                <p className="mt-6 max-w-lg text-[17px] leading-[1.75] text-black/70">
                  {product.name}, {series?.description?.toLowerCase() || "designed for enduring performance and visual clarity."}
                </p>

                <div className="relative mt-12">
                  <button
                    type="button"
                    onClick={() => setFinishOpen((open) => !open)}
                    className="flex h-[58px] w-full items-center justify-between rounded-full bg-white px-4 pr-3 text-left shadow-[0_18px_55px_rgba(0,0,0,0.045)] transition hover:shadow-[0_22px_65px_rgba(0,0,0,0.07)]"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full">
                        {activeFinishDisc ? (
                          <Image src={activeFinishDisc} alt="" fill sizes="36px" className="object-cover" />
                        ) : (
                          <span className="absolute inset-0 rounded-full" style={{ backgroundColor: finish?.hex }} />
                        )}
                      </span>
                      <span className="truncate text-[16px] text-black">
                        {variant.model} - {finish?.name}
                        {finish?.type === "pvd" ? " Pvd" : ""}
                      </span>
                    </span>
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#ece9e2] text-[18px] leading-none text-black/45">
                      {finishOpen ? "⌃" : "⌄"}
                    </span>
                  </button>

                  <AnimatePresence>
                    {finishOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.2 }}
                        className="absolute left-0 right-0 z-20 mt-3 overflow-hidden rounded-[28px] border border-black/8 bg-white shadow-[0_24px_80px_rgba(0,0,0,0.12)]"
                      >
                        {product.variants.map((entry, i) => {
                          const entryFinish = getFinishById(entry.finish);
                          const disc = getFinishDiscImage(entry.finish);
                          const active = variant.finish === entry.finish;

                          return (
                            <button
                              key={entry.finish}
                              type="button"
                              onClick={() => {
                                setSelectedFinish(entry.finish);
                                setFinishOpen(false);
                              }}
                              className={`flex w-full cursor-pointer items-center gap-4 px-5 py-4 text-left transition hover:bg-black/[0.035] ${
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
                                {entry.model} - {entryFinish?.name}
                                {entryFinish?.type === "pvd" ? " Pvd" : ""}
                              </span>
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="mt-8">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        addToCart(product.slug, variant.finish);
                        setCartAdded(true);
                        setTimeout(() => setCartAdded(false), 2200);
                      }}
                      className="flex h-[58px] flex-1 cursor-pointer items-center justify-center rounded-full bg-black text-[15px] font-medium tracking-[0.02em] text-white transition hover:bg-black/85"
                    >
                      {cartAdded ? "Added" : "Add to Cart"}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleWishlist(product.slug, variant.finish)}
                      aria-label={isInWishlist(product.slug, variant.finish) ? "Remove from wishlist" : "Add to wishlist"}
                      aria-pressed={isInWishlist(product.slug, variant.finish)}
                      className="flex h-[58px] w-[58px] shrink-0 cursor-pointer items-center justify-center rounded-full border border-black/15 transition hover:border-black/40"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill={isInWishlist(product.slug, variant.finish) ? "currentColor" : "none"}
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={addToProposal}
                    className="mt-3 flex h-11 w-full cursor-pointer items-center justify-center rounded-full text-[13px] font-medium text-black/45 transition hover:bg-white/55 hover:text-black"
                  >
                    {isInProposal ? "Open project board" : "Add to project board"}
                  </button>
                </div>

                <div className="mt-10 border-t border-black/10">
                  <button
                    type="button"
                    onClick={() => setExpandedSpec(!expandedSpec)}
                    className="flex w-full cursor-pointer items-center justify-between py-6 text-left"
                  >
                    <span className="text-[18px] font-medium">Technical Features and Download</span>
                    <span className="text-[20px] text-black/40">{expandedSpec ? "-" : "+"}</span>
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
        </section>

        {contextImage && (
          <section className="px-5 py-20 sm:px-8 lg:px-16 lg:py-28">
            <div className="mx-auto max-w-[1780px]">
              <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                <div className="relative aspect-[4/3] overflow-hidden rounded-[28px] bg-black">
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
                  <h2 className="mt-4 font-heading text-[clamp(2.4rem,4.6vw,4.4rem)] font-light leading-[0.92] tracking-[-0.055em]">
                    Part of a complete bathroom language.
                  </h2>
                  <p className="mt-6 text-[16px] leading-[1.85] text-black/55">
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

        {related.length > 0 && (
          <section className="border-t border-black/6 px-5 py-20 sm:px-8 lg:px-16 lg:py-28">
            <div className="mx-auto max-w-[1780px]">
              <div className="mb-14 flex items-end justify-between">
                <div>
                  <p className="text-[12px] uppercase tracking-[0.34em] text-black/40">Related</p>
                  <h2 className="mt-3 font-heading text-[clamp(2.4rem,4.5vw,4.6rem)] font-light leading-[0.92] tracking-[-0.055em]">
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
