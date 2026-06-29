"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { collectionLandingImages, getFinishDiscImage } from "@/data/images";
import { formatPrice, getAllFinishes, getAllSeries, getProductsBySeries } from "@/lib/utils";

const collectionCopy: Record<
  string,
  {
    line: string;
    bestFor: string;
    mood: string;
  }
> = {
  joy: {
    line: "Soft curves, easy warmth, and the safest premium choice for homes and hospitality.",
    bestFor: "Homes, hotel rooms, premium apartments",
    mood: "Warm minimal",
  },
  up: {
    line: "Streamlined forms with a slightly more dynamic, contemporary character.",
    bestFor: "Developments, designers, repeat projects",
    mood: "Fluid modern",
  },
  art: {
    line: "Architectural stainless steel presence for rooms that need a stronger design signature.",
    bestFor: "Villas, suites, statement bathrooms",
    mood: "Sculptural precision",
  },
  quatro: {
    line: "Crisp geometry for sharper interiors, modern projects, and bolder specifications.",
    bestFor: "Modern apartments, offices, developer schemes",
    mood: "Geometric calm",
  },
};

function getStartingPrice(seriesId: string) {
  const prices = getProductsBySeries(seriesId).flatMap((product) =>
    product.variants.map((variant) => variant.price)
  );
  return prices.length ? Math.min(...prices) : 0;
}

export default function CollectionsLanding() {
  const series = getAllSeries();
  const finishes = getAllFinishes();

  return (
    <main className="bg-white text-charcoal">
      <section className="relative flex min-h-[72svh] items-end overflow-hidden bg-charcoal pt-20 text-white">
        <Image
          src="/images/steinheim/final/collections-hero.jpg"
          alt="Steinheim Egypt bathroom interior"
          fill
          priority
          quality={90}
          className="object-cover opacity-70"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/25" />
        <div className="relative z-10 mx-auto w-full max-w-[1600px] px-5 pb-12 sm:px-8 sm:pb-16 lg:px-10 lg:pb-20">
          <ScrollReveal>
            <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-white/65">
              Steinheim Egypt collections
            </p>
            <div className="mt-6 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
              <h1 className="max-w-5xl font-heading text-[clamp(3.2rem,7vw,7.4rem)] leading-[0.88]">
                Choose the language of the bathroom.
              </h1>
              <p className="max-w-xl text-[15px] leading-[1.9] text-white/72">
                Each Steinheim collection is built as a complete design system: basin mixers, showers,
                bath mixers, accessories, finishes, and project-ready model codes.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="bg-white py-18 sm:py-24 lg:py-28">
        <div className="mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-10">
          <ScrollReveal className="mb-12 grid gap-6 lg:grid-cols-[0.55fr_1.45fr]">
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-warm-gray">
              Collection overview
            </p>
            <h2 className="max-w-5xl font-heading text-[clamp(2.1rem,4.8vw,5.2rem)] leading-[0.95] text-charcoal">
              Four different moods, one premium Steinheim standard.
            </h2>
          </ScrollReveal>

          <div className="grid gap-4 lg:grid-cols-2">
            {series.map((collection, index) => {
              const products = getProductsBySeries(collection.id);
              const copy = collectionCopy[collection.id];
              const startingPrice = getStartingPrice(collection.id);

              return (
                <motion.article
                  key={collection.id}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.55, delay: index * 0.06 }}
                  className="group"
                >
                  <Link href={`/collections/${collection.id}`} className="block">
                    <div className="relative aspect-[16/10] overflow-hidden bg-charcoal">
                      <Image
                        src={collectionLandingImages[collection.id]}
                        alt={`${collection.name} collection`}
                        fill
                        quality={90}
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-cover opacity-95 brightness-[0.84] saturate-[0.88] transition duration-[1200ms] group-hover:scale-[1.04] group-hover:brightness-[0.74]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10" />
                      <div className="absolute inset-x-0 top-0 flex items-start justify-between p-5 text-white">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.22em] text-white/60">
                            Series {collection.code}
                          </p>
                          <h3 className="mt-2 font-heading text-[clamp(3.2rem,6vw,5.8rem)] leading-none">
                            {collection.name}
                          </h3>
                        </div>
                        <span className="flex h-9 w-9 items-center justify-center border border-white/35 text-white transition group-hover:bg-white group-hover:text-charcoal">
                          →
                        </span>
                      </div>
                      <div className="absolute bottom-0 left-0 max-w-[82%] p-5 text-white">
                        <p className="text-[14px] leading-[1.65] text-white/80">{copy?.line}</p>
                      </div>
                    </div>

                    <div className="border-x border-b border-border-light bg-white p-5">
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-warm-gray">{copy?.mood}</p>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-warm-gray">
                          {products.length} products
                        </p>
                      </div>
                      <p className="mt-3 text-[14px] leading-[1.7] text-stone">{copy?.bestFor}</p>
                      {startingPrice > 0 && (
                        <p className="mt-4 text-[12px] text-charcoal">From {formatPrice(startingPrice)}</p>
                      )}
                    </div>
                  </Link>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-[0.55fr_1.45fr]">
            <ScrollReveal>
              <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-warm-gray">
                Finish system
              </p>
              <h2 className="mt-4 font-heading text-[clamp(2rem,4vw,4rem)] leading-[1] text-charcoal">
                The finish decides the room&apos;s temperature.
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={0.08} className="grid gap-3 sm:grid-cols-3">
              {finishes.map((finish) => {
                const disc = getFinishDiscImage(finish.id);
                return (
                  <div
                    key={finish.id}
                    className="flex items-center gap-4 border border-border-light bg-white p-4"
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
                        {finish.type === "pvd" ? "PVD finish" : "Core finish"}
                      </span>
                    </span>
                  </div>
                );
              })}
            </ScrollReveal>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-charcoal py-24 text-white sm:py-32 lg:py-40">
        <Image
          src="/images/steinheim/final/collections-cta.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-15"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal/50 via-charcoal/30 to-charcoal/70" />
        <div className="relative z-10 mx-auto flex max-w-[1200px] flex-col items-center px-5 text-center sm:px-8">
          <ScrollReveal>
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/45">
              Need direction?
            </p>
            <h2 className="mt-4 font-heading text-[clamp(2.3rem,5vw,5rem)] leading-[0.95]">
              If the choice is not obvious, build a project board.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-[1.85] text-white/65">
              Add products from any collection, compare finishes, and prepare a clean project request for the
              Steinheim Egypt team.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Link
                href="/collections/joy"
                className="bg-white px-7 py-4 text-[11px] font-medium uppercase tracking-[0.16em] text-charcoal transition hover:bg-white/85"
              >
                Start with Joy
              </Link>
              <Link
                href="/trade#smart-room-calculator"
                className="border border-white/25 bg-white/5 px-7 py-4 text-[11px] font-medium uppercase tracking-[0.16em] text-white backdrop-blur-sm transition hover:border-white hover:bg-white/10"
              >
                Trade guidance
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </main>
  );
}
