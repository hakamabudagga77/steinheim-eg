"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

function AnimatedLine({ children, delay }: { children: string; delay: number }) {
  return (
    <span className="block overflow-hidden">
      <motion.span
        className="block"
        initial={{ y: "110%" }}
        animate={{ y: 0 }}
        transition={{ duration: 1.2, delay, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.span>
    </span>
  );
}

export default function Hero() {
  const t = useTranslations("home.hero");

  return (
    <section className="relative h-svh min-h-[700px] overflow-hidden bg-charcoal text-white">
      <motion.div
        initial={{ scale: 1.06 }}
        animate={{ scale: 1 }}
        transition={{ duration: 6, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0"
      >
        <Image
          src="/images/lifestyle/hero.png"
          alt={t("imageAlt")}
          fill
          priority
          quality={100}
          unoptimized
          sizes="100vw"
          className="object-cover object-[center_60%]"
        />
      </motion.div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/20" />

      <div className="relative z-10 mx-auto flex h-full max-w-[1440px] flex-col justify-end px-5 pb-14 pt-28 sm:px-8 sm:pb-16 lg:px-12 lg:pb-20">
        <h1 className="max-w-4xl font-heading text-[clamp(2.8rem,6.5vw,6rem)] leading-[1.02] tracking-[-0.02em]">
          <AnimatedLine delay={0.15}>{t("headlineLineOne")}</AnimatedLine>
          <AnimatedLine delay={0.3}>{t("headlineLineTwo")}</AnimatedLine>
          <AnimatedLine delay={0.45}>{t("headlineLineThree")}</AnimatedLine>
        </h1>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.7, ease: [0.22, 0.76, 0.2, 1] }}
          className="mt-10"
        >
          <Link
            href="/collections"
            className="inline-flex items-center gap-3 border border-white/30 bg-white/8 backdrop-blur-sm px-7 py-3.5 text-[12px] font-medium tracking-[0.08em] text-white transition-all duration-300 hover:bg-white hover:text-charcoal"
          >
            {t("primaryCta")}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
