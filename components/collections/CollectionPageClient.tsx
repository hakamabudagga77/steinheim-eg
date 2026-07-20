"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import ProductCard from "@/components/product/ProductCard";
import ProjectsCarousel from "@/components/collections/ProjectsCarousel";
import OverviewCardsSpread from "@/components/collections/OverviewCardsSpread";
import PageTransition from "@/components/layout/PageTransition";
import AutoplayVideo from "@/components/ui/AutoplayVideo";
import Modal from "@/components/ui/Modal";
import {
  collectionBanners,
  getCollectionContextImage,
  getFinishDiscImage,
} from "@/data/images";
import type { Finish, Product, Series } from "@/lib/utils";

const collectionHeroVideos: Record<string, string> = {
  joy: "/videos/joy-hero-v2.mp4",
  art: "/videos/art-hero.mp4",
};

// Card images stay code-defined (they are visual assets, not copy); the
// eyebrow/title/body text for each card is resolved from collectionPage.strategy.
const collectionCardImages: Record<string, string[]> = {
  joy: [
    "/images/steinheim/karim-2026/detail-joy-basin.webp",
    "/images/steinheim/karim-2026/home-joy.webp",
    "/images/steinheim/karim-2026/landing-joy.webp",
  ],
  up: [
    "/images/steinheim/karim-2026/detail-up-shower.webp",
    "/images/steinheim/karim-2026/home-up.webp",
    "/images/steinheim/karim-2026/landing-up.webp",
  ],
  art: [
    "/images/steinheim/karim-2026/detail-art-bath.webp",
    "/images/steinheim/karim-2026/home-art.webp",
    "/images/steinheim/karim-2026/landing-art.webp",
  ],
  quatro: [
    "/images/steinheim/karim-2026/detail-quatro-wall.webp",
    "/images/steinheim/karim-2026/home-quatro.webp",
    "/images/steinheim/karim-2026/landing-quatro.webp",
  ],
};

const cardOrder = ["intro", "concept", "design"] as const;

type LiveData = Record<string, { variants: Array<{ finish: string; price: number; inventory: number; inStock: boolean }> }>;

export default function CollectionPageClient({
  series,
  products,
  finishes,
  liveData,
}: {
  series: Series;
  products: Product[];
  finishes: Finish[];
  liveData: LiveData;
}) {
  const t = useTranslations("collectionPage");
  const [globalFinish, setGlobalFinish] = useState<string | null>(finishes[0]?.id ?? null);
  const [selectedStory, setSelectedStory] = useState<string | null>(null);
  const heroSectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroSectionRef,
    offset: ["start start", "end start"],
  });
  const heroProgressSmooth = useSpring(heroProgress, { stiffness: 100, damping: 30, mass: 0.4 });
  const heroMediaY = useTransform(heroProgressSmooth, [0, 1], ["0%", "22%"]);
  const heroMediaScale = useTransform(heroProgressSmooth, [0, 1], [1, 1.18]);
  const heroTitleY = useTransform(heroProgressSmooth, [0, 1], ["0%", "60%"]);
  const heroTitleOpacity = useTransform(heroProgressSmooth, [0, 0.7], [1, 0]);

  const strategy = {
    family: t(`strategy.${series.id}.family`),
    headline: t(`strategy.${series.id}.headline`),
    description: t(`strategy.${series.id}.description`),
    setup: t(`strategy.${series.id}.setup`),
    cards: cardOrder.map((key, i) => ({
      eyebrow: t(`strategy.${series.id}.cards.${key}.eyebrow`),
      title: t(`strategy.${series.id}.cards.${key}.title`),
      body: t(`strategy.${series.id}.cards.${key}.body`),
      image: collectionCardImages[series.id]?.[i] ?? "",
    })),
  };
  const contextImage = getCollectionContextImage(series.id);
  const selectedStoryCard = selectedStory
    ? strategy.cards.find((card) => card.title === selectedStory)
    : null;

  return (
    <PageTransition>
      <div className="bg-[#ece9e2] text-[#0a0a0a]">
        <section className="relative bg-black text-white">
          <div className="sticky top-0 h-svh min-h-[86svh] overflow-hidden">
            <motion.div style={{ y: heroMediaY, scale: heroMediaScale }} className="absolute inset-x-0 -top-[8%] h-[116%] origin-center">
              {collectionHeroVideos[series.id] ? (
                <AutoplayVideo
                  src={collectionHeroVideos[series.id]}
                  poster={collectionBanners[series.id]}
                  className="h-full w-full object-cover object-center"
                />
              ) : (
                <Image
                  src={collectionBanners[series.id]}
                  alt={`${series.name} bathroom collection`}
                  fill
                  priority
                  sizes="100vw"
                  quality={92}
                  className="object-cover"
                />
              )}
            </motion.div>
            <div className="absolute inset-0 bg-black/24" />
          </div>

          <div className="relative z-10 -mt-[100svh]">
            <section ref={heroSectionRef} className="relative flex min-h-[86svh] items-center justify-center px-6">
              <div className="absolute left-0 right-0 top-[124px] px-6 sm:px-10 lg:px-16">
                <div className="mx-auto max-w-[1780px]">
                  <p className="text-[18px] font-medium text-white">
                    <Link href="/" className="transition hover:text-white/70">{t("breadcrumb.home")}</Link>
                    <span className="px-2 text-white/75">·</span>
                    <Link href="/collections" className="transition hover:text-white/70">{t("breadcrumb.collections")}</Link>
                    <span className="px-2 text-white/75">·</span>
                    <span>{series.name}</span>
                  </p>
                </div>
              </div>

              <motion.div style={{ y: heroTitleY, opacity: heroTitleOpacity }}>
                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 0.76, 0.2, 1] }}
                  className="font-heading text-[clamp(5.6rem,14vw,14rem)] uppercase leading-[0.82] tracking-[-0.045em]"
                >
                  {series.name}
                </motion.h1>
              </motion.div>
            </section>

            <section className="flex h-svh min-h-[86svh] items-center justify-center px-6 text-center">
              <motion.h2
                initial={{ opacity: 0, y: 34 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ amount: 0.6, once: false }}
                transition={{ duration: 0.9, ease: [0.22, 0.76, 0.2, 1] }}
                className="max-w-4xl text-[clamp(2.2rem,4.4vw,4.6rem)] font-normal leading-[1.08] tracking-[-0.05em] text-white/90"
              >
                {strategy.headline}
              </motion.h2>
            </section>
          </div>
        </section>

        <section className="sticky top-0 z-30 border-b border-black/8 bg-[#ece9e2]/96 px-5 backdrop-blur-sm sm:px-8 lg:px-16">
          <div className="mx-auto flex max-w-[1780px] items-center justify-between gap-4 py-3">
            <p className="shrink-0 text-[16px] font-medium tracking-[-0.03em] sm:text-[20px]">{series.name}</p>
            <div className="flex items-center gap-4 overflow-x-auto text-[14px] sm:gap-8 sm:text-[16px]">
              {([
                ["overview", t("nav.overview")],
                ["setup", t("nav.setup")],
                ["products", t("nav.products")],
              ] as Array<[string, string]>).map(([anchor, label]) => (
                <a
                  key={anchor}
                  href={`#${anchor}`}
                  className={`whitespace-nowrap py-2 text-black/70 transition hover:text-black ${
                    anchor === "products" ? "rounded-full border-b-0 bg-black px-5 text-white hover:text-white sm:px-8" : ""
                  }`}
                >
                  {label}
                </a>
              ))}
            </div>
          </div>
        </section>

        <div id="overview" className="scroll-mt-[140px]">
          <OverviewCardsSpread cards={strategy.cards} onSelectStory={setSelectedStory} />
        </div>

        <section id="products" className="scroll-mt-[140px] border-t border-black/8 px-5 py-16 sm:px-8 lg:px-16 lg:py-20">
          <div className="mx-auto max-w-[1780px]">
            <div className="mb-16 text-center">
              <p className="text-[12px] uppercase tracking-[0.34em] text-black/40">{t("chooseFinish")}</p>
              <h2 className="mt-4 font-heading text-[clamp(1.8rem,3vw,2.6rem)] font-normal tracking-[-0.03em]">
                {t("seeRange", { series: series.name })}
              </h2>
              <div className="mt-10 flex flex-nowrap items-start justify-center gap-3 sm:flex-wrap sm:gap-4">
                {finishes.map((finish) => {
                  const disc = getFinishDiscImage(finish.id);
                  const active = globalFinish === finish.id;
                  return (
                    <button
                      key={finish.id}
                      type="button"
                      onClick={() => setGlobalFinish(finish.id)}
                      title={finish.name}
                      aria-pressed={active}
                      aria-label={finish.name}
                      className="group flex shrink-0 flex-col items-center gap-2.5 cursor-pointer"
                    >
                      <span
                        className={`relative h-11 w-11 overflow-hidden rounded-full border-2 transition-all duration-300 sm:h-16 sm:w-16 ${
                          active ? "scale-110 border-black shadow-[0_8px_24px_rgba(0,0,0,0.18)]" : "border-transparent group-hover:border-black/25"
                        }`}
                      >
                        {disc ? <Image src={disc} alt="" fill sizes="64px" className="object-cover" /> : <span className="absolute inset-0" style={{ backgroundColor: finish.hex }} />}
                      </span>
                      <span className={`hidden text-[11px] uppercase tracking-[0.12em] transition-colors sm:block ${active ? "text-black font-medium" : "text-black/45 group-hover:text-black/70"}`}>
                        {finish.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <motion.div
              key={globalFinish}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-2 gap-10 md:gap-12 lg:grid-cols-3 lg:gap-y-20"
            >
              {products.map((product, index) => (
                <motion.div
                  key={product.slug}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.55, delay: Math.min(index * 0.05, 0.2) }}
                >
                  <ProductCard product={product} liveVariants={liveData[product.slug]?.variants} finish={globalFinish} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <section id="setup" className="scroll-mt-[140px] border-t border-black/8 px-5 py-24 sm:px-8 lg:px-16 lg:py-32">
          <div className="mx-auto grid max-w-[1780px] items-center gap-16 lg:grid-cols-2">
            <div>
              <p className="text-[18px] uppercase tracking-[0.3em] text-black/45">{t("setupEyebrow")}</p>
              <h2 className="mt-8 max-w-3xl text-[clamp(3rem,6vw,6rem)] font-normal leading-[0.98] tracking-[-0.06em]">
                {t("setupHeadline")}
              </h2>
              <p className="mt-8 max-w-2xl text-[20px] leading-[1.65] text-black/62">
                {strategy.setup}
              </p>
              <div className="mt-12 flex flex-wrap gap-3">
                {finishes.map((finish) => {
                  const disc = getFinishDiscImage(finish.id);
                  return (
                    <span key={finish.id} className="flex items-center gap-3 rounded-full border border-black/10 px-5 py-3">
                      <span className="relative h-7 w-7 overflow-hidden rounded-full">
                        {disc ? <Image src={disc} alt="" fill sizes="28px" className="object-cover" /> : null}
                      </span>
                      <span className="text-[13px]">{finish.name}</span>
                    </span>
                  );
                })}
              </div>
            </div>
            {contextImage ? (
              <div className="relative aspect-[4/5] overflow-hidden bg-black">
                <Image src={contextImage} alt={`${series.name} in context`} fill quality={90} sizes="50vw" className="object-cover" />
              </div>
            ) : null}
          </div>
        </section>

        <ProjectsCarousel collectionSlug={series.id as "joy" | "up" | "art" | "quatro"} collectionName={series.name} />

        <section className="border-t border-black/8 px-5 py-20 sm:px-8 lg:px-16">
          <div className="mx-auto grid max-w-[1780px] lg:grid-cols-2">
            {[
              [t("backToOverview.title"), t("backToOverview.body"), "#overview"],
              [t("tradeStudio.title"), t("tradeStudio.body"), "/trade"],
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

        <Modal
          open={!!selectedStoryCard}
          onClose={() => setSelectedStory(null)}
          centered
          backdropClassName="fixed inset-0 z-[80] flex items-center justify-center bg-black/72 px-4 py-6 backdrop-blur-[2px]"
        >
          {selectedStoryCard && (
              <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.42, ease: [0.22, 0.76, 0.2, 1] }}
                className="relative grid max-h-[92svh] w-full max-w-[1760px] overflow-hidden rounded-[8px] bg-[#ece9e2] text-black lg:grid-cols-2"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setSelectedStory(null)}
                  aria-label={t("close")}
                  className="absolute end-6 top-6 z-20 flex h-16 w-16 items-center justify-center rounded-full bg-black/8 text-black/45 transition hover:bg-black hover:text-white"
                >
                  <svg width="28" height="28" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2">
                    <line x1="4" y1="4" x2="16" y2="16" />
                    <line x1="16" y1="4" x2="4" y2="16" />
                  </svg>
                </button>
                <div className="relative min-h-[42svh] lg:min-h-[82svh]">
                  <Image
                    src={selectedStoryCard.image}
                    alt={selectedStoryCard.title}
                    fill
                    quality={92}
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
                <div className="flex items-center px-8 py-20 sm:px-14 lg:px-24">
                  <div className="max-w-2xl">
                    <p className="text-[18px] uppercase tracking-[0.32em] text-black/80">
                      {selectedStoryCard.eyebrow}
                    </p>
                    <h2 className="mt-8 text-[clamp(3rem,5vw,6rem)] font-normal leading-[0.95] tracking-[-0.07em]">
                      {selectedStoryCard.title}
                    </h2>
                    <p className="mt-8 text-[clamp(1.1rem,1.45vw,1.45rem)] leading-[1.65] text-black/72">
                      {selectedStoryCard.body} {strategy.description}
                    </p>
                    <div className="mt-10 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStory(null);
                          document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="rounded-full border border-black px-10 py-3 text-[15px] transition hover:bg-black hover:text-white"
                      >
                        {t("viewProducts")}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStory(null);
                          document.getElementById("setup")?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="rounded-full border border-black/18 px-10 py-3 text-[15px] text-black/58 transition hover:border-black/45 hover:text-black"
                      >
                        {t("viewSetup")}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
          )}
        </Modal>
      </div>
    </PageTransition>
  );
}
