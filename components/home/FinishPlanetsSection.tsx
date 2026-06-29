"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const BASE = "/images/steinheim/finish-planets";

const discs = [
  { id: "chrome", label: "Chrome", tag: "Standard", left: "5%", top: "30%", w: "13.5%", rotate: -6 },
  { id: "brushed-nickel", label: "Brushed Nickel", tag: "Standard", left: "19.5%", top: "24%", w: "13.5%", rotate: -3 },
  { id: "matte-black", label: "Matte Black", tag: "PVD", left: "35%", top: "20%", w: "14.5%", rotate: 0 },
  { id: "brushed-gold", label: "Brushed Gold", tag: "PVD", left: "51%", top: "20%", w: "14.5%", rotate: 2 },
  { id: "coffee-gold", label: "Coffee Gold", tag: "PVD", left: "66.5%", top: "24%", w: "13.5%", rotate: 4 },
  { id: "metal-gun", label: "Metal Gun", tag: "PVD", left: "81%", top: "30%", w: "13.5%", rotate: 6 },
];

export default function FinishPlanetsSection() {
  const t = useTranslations("home.finishes");
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-8%" });

  return (
    <section className="relative overflow-hidden bg-[#070707] text-white">
      {/* Heading */}
      <div className="relative z-20 mx-auto max-w-[1440px] px-8 pt-32 lg:px-12 lg:pt-48">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 0.76, 0.2, 1] }}
          className="text-center"
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-white/30">
            {t("eyebrow")}
          </p>
          <h2 className="mx-auto mt-7 max-w-3xl font-heading text-[clamp(2.6rem,5.5vw,5.5rem)] leading-[1] tracking-[-0.015em]">
            {t("headline")}
          </h2>
          <p className="mx-auto mt-8 max-w-lg text-[15px] leading-[1.9] text-white/35 font-light">
            {t("body")}
          </p>
        </motion.div>
      </div>

      {/* Full-width planet stage */}
      <div ref={ref} className="relative z-10 w-full py-6 lg:py-10">
        {/* Desktop */}
        <div className="relative hidden aspect-[16/7.5] w-full md:block">
          {/* Full-width dark marble background */}
          <Image
            src={`${BASE}/finish-planets-bg.webp`}
            alt=""
            fill
            quality={85}
            sizes="100vw"
            className="object-cover object-bottom"
            aria-hidden="true"
          />
          {/* Cinematic vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_45%,transparent_0%,rgba(7,7,7,0.65)_100%)]" />
          {/* Top/bottom fade to section bg */}
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#070707] to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#070707] to-transparent" />

          {/* Discs in an arc */}
          {discs.map((disc, index) => (
            <motion.div
              key={disc.id}
              className="group absolute flex flex-col items-center"
              style={{ left: disc.left, top: disc.top, width: disc.w }}
              initial={{
                opacity: 0,
                y: "-50vh",
                rotate: disc.rotate - 15,
                scale: 0.8,
              }}
              animate={
                isInView
                  ? {
                      opacity: 1,
                      y: 0,
                      rotate: disc.rotate,
                      scale: 1,
                    }
                  : {}
              }
              transition={{
                duration: 1.2,
                delay: index * 0.14,
                ease: [0.16, 0.9, 0.3, 1.08],
              }}
              whileHover={{
                y: -14,
                scale: 1.06,
                rotate: 0,
                transition: { duration: 0.45, ease: [0.22, 0.76, 0.2, 1] },
              }}
            >
              <Image
                src={`${BASE}/disc-${disc.id}.webp`}
                alt={disc.label}
                width={360}
                height={360}
                quality={82}
                sizes="15vw"
                className="relative z-10 h-auto w-full drop-shadow-[0_20px_50px_rgba(0,0,0,0.55)] transition-[filter] duration-500 group-hover:drop-shadow-[0_25px_60px_rgba(0,0,0,0.7)]"
              />

              {/* Reflection glow on marble floor */}
              <div
                className="absolute -bottom-[20%] left-[15%] right-[15%] h-[30%] rounded-full opacity-20 blur-2xl transition-opacity duration-500 group-hover:opacity-35"
                style={{
                  background: disc.id === "chrome" ? "radial-gradient(ellipse, rgba(200,200,210,0.6), transparent)"
                    : disc.id === "brushed-nickel" ? "radial-gradient(ellipse, rgba(190,185,175,0.5), transparent)"
                    : disc.id === "matte-black" ? "radial-gradient(ellipse, rgba(60,60,60,0.4), transparent)"
                    : disc.id === "brushed-gold" ? "radial-gradient(ellipse, rgba(210,180,100,0.5), transparent)"
                    : disc.id === "coffee-gold" ? "radial-gradient(ellipse, rgba(180,140,80,0.5), transparent)"
                    : "radial-gradient(ellipse, rgba(120,120,125,0.4), transparent)"
                }}
              />

              {/* Label */}
              <motion.div
                className="relative z-10 mt-5 text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  duration: 0.5,
                  delay: index * 0.14 + 1,
                  ease: "easeOut",
                }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/65 transition-colors duration-300 group-hover:text-white/90 sm:text-[11px]">
                  {disc.label}
                </p>
                <p className="mt-1.5 text-[8px] uppercase tracking-[0.2em] text-white/20 sm:text-[9px]">
                  {disc.tag}
                </p>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Mobile: static fallback */}
        <div className="relative aspect-[16/9] w-full md:hidden">
          <Image
            src={`${BASE}/finish-planets-static.webp`}
            alt="Steinheim PVD finish discs — Chrome, Brushed Nickel, Matte Black, Brushed Gold, Coffee Gold, Metal Gun"
            fill
            quality={85}
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="relative z-20 mx-auto max-w-[1440px] px-8 pb-32 pt-4 lg:px-12 lg:pb-44 lg:pt-8">
        <div className="border-t border-white/8 pt-12">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-white/20">
                {t("summary")}
              </p>
              <h3 className="mt-4 font-heading text-[clamp(2rem,3.5vw,3.4rem)] leading-[1.1]">
                {t("subheadline")}
              </h3>
              <p className="mt-5 max-w-xl text-[14px] leading-[1.85] text-white/32 font-light">
                {t("availability")}
              </p>
            </motion.div>
            <Link
              href="/collections"
              className="inline-flex shrink-0 items-center bg-white px-10 py-[18px] text-[10px] font-semibold uppercase tracking-[0.2em] text-charcoal transition-all duration-300 hover:bg-white/90"
            >
              {t("cta")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
