"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { collectionLandingImages, getFinishDiscImage } from "@/data/images";
import { getAllFinishes, getAllSeries, getProductsBySeries } from "@/lib/utils";

const collectionCopy: Record<string, { line: string; mood: string }> = {
  joy: {
    line: "Soft balance for private villas, suites, and warm hospitality rooms.",
    mood: "Warm minimal",
  },
  up: {
    line: "A repeatable modern language for developments and project schedules.",
    mood: "Fluid modern",
  },
  art: {
    line: "Architectural precision for statement bathrooms and design-led spaces.",
    mood: "Sculptural precision",
  },
  quatro: {
    line: "Crisp geometry for sharp, contemporary interiors.",
    mood: "Geometric calm",
  },
};

export default function CollectionsLanding() {
  const series = getAllSeries();
  const finishes = getAllFinishes();

  return (
    <main className="bg-[#f3f1ed] text-[#111]">
      {/* Hero */}
      <section className="relative flex min-h-[70svh] items-end overflow-hidden bg-black pt-20 text-white">
        <Image
          src="/images/steinheim/final/collections-hero.jpg"
          alt="Steinheim Egypt bathroom interior"
          fill
          priority
          quality={90}
          className="object-cover opacity-55"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="relative z-10 mx-auto w-full max-w-[1780px] px-5 pb-14 sm:px-8 lg:px-16 lg:pb-20">
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="text-[11px] uppercase tracking-[0.45em] text-white/55"
          >
            Steinheim Collections
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="mt-5 max-w-5xl font-heading text-[clamp(3rem,7.5vw,8rem)] leading-[0.88] tracking-[-0.04em]"
            style={{ fontStyle: "italic" }}
          >
            Four moods, one language.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-6 max-w-xl text-[16px] leading-[1.85] text-white/68"
          >
            Each collection is a complete bathroom system — basin mixers, showers, accessories, and finishes working as one resolved design.
          </motion.p>
        </div>
      </section>

      {/* Collection Cards — Gessi-style large lifestyle cards */}
      <section className="px-5 py-24 sm:px-8 lg:px-16 lg:py-32">
        <div className="mx-auto max-w-[1780px]">
          <div className="grid gap-6 md:grid-cols-2">
            {series.map((collection, index) => {
              const products = getProductsBySeries(collection.id);
              const copy = collectionCopy[collection.id];

              return (
                <motion.article
                  key={collection.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.7, delay: index * 0.08 }}
                >
                  <Link href={`/collections/${collection.id}`} className="group block">
                    <div className="relative aspect-[4/5] overflow-hidden rounded-[22px] bg-black sm:aspect-[3/4] lg:aspect-[4/5]">
                      <Image
                        src={collectionLandingImages[collection.id]}
                        alt={`${collection.name} collection`}
                        fill
                        quality={90}
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover transition duration-[1400ms] group-hover:scale-[1.04]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8 lg:p-10">
                        <p className="text-[10px] uppercase tracking-[0.4em] text-white/50">
                          {copy?.mood} · {products.length} products
                        </p>
                        <h2
                          className="mt-3 font-heading text-[clamp(2.8rem,5.5vw,5rem)] leading-[0.92] tracking-[-0.03em]"
                          style={{ fontStyle: "italic" }}
                        >
                          {collection.name}
                        </h2>
                        <p className="mt-3 max-w-md text-[15px] italic leading-[1.65] text-white/72">
                          {copy?.line}
                        </p>
                        <span className="mt-6 inline-flex items-center gap-3 rounded-full border border-white/30 bg-white/8 px-6 py-2.5 text-[12px] text-white backdrop-blur-sm transition duration-500 group-hover:bg-white group-hover:text-black">
                          Explore collection
                          <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Finishes strip */}
      <section className="border-t border-black/8 px-5 py-20 sm:px-8 lg:px-16 lg:py-28">
        <div className="mx-auto max-w-[1780px]">
          <div className="mb-14 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <p className="text-[12px] uppercase tracking-[0.34em] text-black/40">Finish system</p>
              <h2
                className="mt-4 max-w-3xl text-[clamp(2.4rem,5vw,5.6rem)] font-normal leading-[0.92] tracking-[-0.04em]"
                style={{ fontStyle: "italic" }}
              >
                The finish decides the room.
              </h2>
            </div>
            <Link
              href="/finishes"
              className="rounded-full border border-black/25 px-7 py-3 text-[13px] transition hover:bg-black hover:text-white"
            >
              View all finishes
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {finishes.map((finish, i) => {
              const disc = getFinishDiscImage(finish.id);
              return (
                <motion.div
                  key={finish.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  className="flex items-center gap-5 rounded-[16px] border border-black/6 bg-white p-5 transition hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
                >
                  <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-black/8">
                    {disc ? (
                      <Image src={disc} alt="" fill sizes="56px" className="object-cover" />
                    ) : (
                      <span className="absolute inset-0" style={{ backgroundColor: finish.hex }} />
                    )}
                  </span>
                  <span>
                    <span className="block text-[16px] font-medium">{finish.name}</span>
                    <span className="mt-1 block text-[12px] text-black/45">
                      {finish.type === "pvd" ? "PVD coating" : "Core finish"}
                    </span>
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 pb-24 sm:px-8 lg:px-16 lg:pb-32">
        <div className="mx-auto max-w-[1780px]">
          <div className="grid items-center gap-10 rounded-[22px] bg-black p-8 text-white sm:p-12 lg:grid-cols-[1.2fr_0.8fr] lg:p-16">
            <div>
              <p className="text-[11px] uppercase tracking-[0.4em] text-white/40">Need direction?</p>
              <h2
                className="mt-4 text-[clamp(2rem,4.5vw,4.4rem)] leading-[0.95] tracking-[-0.03em]"
                style={{ fontStyle: "italic" }}
              >
                Build a project board and compare collections side by side.
              </h2>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Link
                href="/collections/joy"
                className="rounded-full bg-white px-8 py-4 text-[13px] font-medium text-black transition hover:bg-white/85"
              >
                Start with Joy
              </Link>
              <Link
                href="/trade"
                className="rounded-full border border-white/30 px-8 py-4 text-[13px] text-white transition hover:border-white hover:bg-white/8"
              >
                Trade guidance
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
