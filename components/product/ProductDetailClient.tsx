"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import PageTransition from "@/components/layout/PageTransition";
import ProductCard from "@/components/product/ProductCard";
import SpecTable from "@/components/product/SpecTable";
import { useTradeProject } from "@/components/catalogue/TradeProjectContext";
import { useCart } from "@/components/cart/CartContext";
import { getCollectionContextImage, getFinishDiscImage, getProductImage } from "@/data/images";
import { formatPrice, getFinishById, getProductBySlug, getProductsBySeries, getSeriesById } from "@/lib/utils";

type LiveVariantData = { finish: string; price: number; inventory: number; inStock: boolean };
type LiveProductData = { slug: string; variants: LiveVariantData[] } | null;
const productInfoTabs = ["Product Description", "Product Detail", "Downloads"] as const;

export default function ProductDetailClient({ slug, liveData = null }: { slug: string; liveData?: LiveProductData }) {
  const product = getProductBySlug(slug)!;
  const [selectedFinish, setSelectedFinish] = useState(product.variants[0].finish);
  const [finishOpen, setFinishOpen] = useState(false);
  const [activeInfoTab, setActiveInfoTab] = useState<(typeof productInfoTabs)[number]>("Product Description");
  const [cartAdded, setCartAdded] = useState(false);
  const { project, addItem, setOpen: setProposalOpen } = useTradeProject();
  const { addItem: addToCart, flyToCart } = useCart();
  const imageWrapRef = useRef<HTMLDivElement>(null);

  const series = getSeriesById(product.series);
  const seriesName = series?.name ?? product.series;
  const variant = product.variants.find((entry) => entry.finish === selectedFinish) ?? product.variants[0];
  const liveVariant = liveData?.variants.find((entry) => entry.finish === variant.finish);
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
        <div className="bg-[#ece9e2] px-5 pb-4 pt-[124px] sm:px-8 lg:px-16">
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
          <div className="grid min-h-[calc(100svh-172px)] lg:grid-cols-[56vw_44vw]">
            <div
              ref={imageWrapRef}
              className="relative flex min-h-[58svh] items-start justify-center overflow-hidden bg-[#ece9e2] pt-2 sm:pt-4 lg:sticky lg:top-0 lg:min-h-[100svh] lg:pt-10"
            >
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
                      className="object-contain object-[center_top] px-[6%] pb-[9%] pt-[3%] transition duration-[900ms] sm:px-[8%] sm:pb-[10%] lg:scale-[1.06] lg:px-[8%] lg:pb-[9%] lg:pt-[4%]"
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
                  {product.name}
                </h1>

                <p className="mt-6 max-w-lg text-[17px] leading-[1.75] text-black/70">
                  {series?.description?.toLowerCase() || "Designed for enduring performance and visual clarity."}
                </p>

                <div className="mt-6 flex items-center gap-3">
                  <p className="text-[24px] font-medium">{formatPrice(liveVariant?.price ?? variant.price)}</p>
                  {liveVariant && liveVariant.inStock === false && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-red-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                      Out of stock
                    </span>
                  )}
                </div>

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
                  <button
                    type="button"
                    onClick={() => {
                      if (imageUrl) flyToCart(imageWrapRef.current, imageUrl);
                      addToCart(product.slug, variant.finish);
                      setCartAdded(true);
                      setTimeout(() => setCartAdded(false), 2200);
                    }}
                    className="flex h-[58px] w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-black text-[15px] font-medium tracking-[0.02em] text-white transition hover:bg-black/85"
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {cartAdded ? (
                        <motion.span
                          key="added"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.25 }}
                          className="flex items-center gap-2"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 12l6 6L20 6" />
                          </svg>
                          Added to Cart
                        </motion.span>
                      ) : (
                        <motion.span
                          key="add"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.25 }}
                        >
                          Add to Cart
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                  <button
                    type="button"
                    onClick={addToProposal}
                    className="mt-3 flex h-11 w-full cursor-pointer items-center justify-center rounded-full text-[13px] font-medium text-black/45 transition hover:bg-white/55 hover:text-black"
                  >
                    {isInProposal ? "Open project board" : "Add to project board"}
                  </button>
                </div>

                <div className="mt-10 border-t border-black/10 pt-6">
                  <p className="text-[13px] leading-[1.8] text-black/45">
                    Technical information, product details, and catalogue downloads are available below.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="border-y border-black/10 bg-[#f3f1ec] px-5 py-12 sm:px-8 lg:px-16 lg:py-16">
          <div className="mx-auto max-w-[1560px]">
            <div className="border-b border-black/18">
              <div className="grid grid-cols-3 gap-0">
                {productInfoTabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveInfoTab(tab)}
                    className={`relative px-1 py-3 text-center text-[12px] font-semibold leading-tight tracking-[-0.02em] transition sm:px-2 sm:py-5 sm:text-[20px] sm:tracking-[-0.04em] lg:text-[27px] ${
                      activeInfoTab === tab ? "text-black" : "text-black/42 hover:text-black/70"
                    }`}
                  >
                    {tab}
                    <span
                      className={`absolute bottom-[-1px] left-1/2 h-[2px] -translate-x-1/2 bg-black transition-all duration-300 ${
                        activeInfoTab === tab ? "w-full" : "w-0"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeInfoTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28 }}
                className="grid gap-10 py-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16 lg:py-14"
              >
                {activeInfoTab === "Product Description" && (
                  <>
                    <div className="space-y-6">
                      <p className="max-w-xl text-[17px] leading-[1.85] text-black/72">
                        {product.name} from the {seriesName} collection brings Steinheim&apos;s
                        architectural bathroom language into a precise, project-ready product.
                        The current selection is shown in {finish?.name ?? "the selected finish"} with model
                        number {variant.model}.
                      </p>
                      <p className="max-w-xl text-[15px] leading-[1.9] text-black/52">
                        {series?.description || "Designed for enduring performance, visual clarity, and long-term specification."}
                      </p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="border border-black/10 p-8">
                        <p className="text-[11px] uppercase tracking-[0.24em] text-black/36">Best for</p>
                        <p className="mt-4 text-[18px] leading-[1.55]">
                          Homes, villas, hospitality bathrooms, and trade specifications where the collection language needs to stay consistent.
                        </p>
                      </div>
                      <div className="border border-black/10 p-8">
                        <p className="text-[11px] uppercase tracking-[0.24em] text-black/36">Selected finish</p>
                        <div className="mt-4 flex items-center gap-4">
                          <span className="relative h-12 w-12 overflow-hidden rounded-full">
                            {activeFinishDisc ? (
                              <Image src={activeFinishDisc} alt="" fill sizes="48px" className="object-cover" />
                            ) : (
                              <span className="absolute inset-0 rounded-full" style={{ backgroundColor: finish?.hex }} />
                            )}
                          </span>
                          <span className="text-[18px]">{finish?.name ?? variant.finish}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {activeInfoTab === "Product Detail" && (
                  <>
                    <div className="border border-black/10 p-8 lg:p-10">
                      <div className="grid gap-5 text-[16px]">
                        <div className="flex justify-between gap-8 border-b border-black/8 pb-4">
                          <span className="text-black/52">Product Number</span>
                          <span className="text-right font-medium">{variant.model}</span>
                        </div>
                        <div className="flex justify-between gap-8 border-b border-black/8 pb-4">
                          <span className="text-black/52">Collection</span>
                          <span className="text-right font-medium">{seriesName}</span>
                        </div>
                        <div className="flex justify-between gap-8 border-b border-black/8 pb-4">
                          <span className="text-black/52">Finish</span>
                          <span className="text-right font-medium">{finish?.name ?? variant.finish}</span>
                        </div>
                        <div className="flex justify-between gap-8">
                          <span className="text-black/52">Application</span>
                          <span className="text-right font-medium">{product.name}</span>
                        </div>
                      </div>
                    </div>
                    <div className="border border-black/10 p-8 lg:p-10">
                      <SpecTable product={product} />
                    </div>
                  </>
                )}

                {activeInfoTab === "Downloads" && (
                  <>
                    <div>
                      <p className="max-w-xl text-[17px] leading-[1.85] text-black/70">
                        Download the current Steinheim catalogue or request the exact technical sheet for
                        {` ${seriesName} ${product.name}`} in {finish?.name ?? "the selected finish"}.
                      </p>
                      <p className="mt-5 max-w-xl text-[14px] leading-[1.85] text-black/45">
                        Final stock, trade pricing, lead times, and project quantities should still be confirmed with Steinheim Egypt.
                      </p>
                    </div>
                    <div className="space-y-3">
                      <a
                        href="/catalogues/steinheim-catalogue-2026.pdf"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between border border-black/12 px-6 py-5 text-[15px] transition hover:border-black hover:bg-black hover:text-white"
                      >
                        <span>Open Steinheim Catalogue 2026</span>
                        <span aria-hidden="true">↗</span>
                      </a>
                      <Link
                        href="/contact"
                        className="flex items-center justify-between border border-black/12 px-6 py-5 text-[15px] transition hover:border-black hover:bg-black hover:text-white"
                      >
                        <span>Request technical sheet for {variant.model}</span>
                        <span aria-hidden="true">→</span>
                      </Link>
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
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
