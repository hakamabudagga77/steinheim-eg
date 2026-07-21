"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Logo from "@/components/ui/Logo";
import ShowroomReel from "@/components/home/ShowroomReel";
import TradeSetupOpenButton from "@/components/trade/TradeSetupOpenButton";
import AutoplayVideo from "@/components/ui/AutoplayVideo";
import { useAutoplayVideo } from "@/lib/useAutoplayVideo";
import { projectReferences, type ProjectReference } from "@/data/project-references";

const heroVideo =
  "https://steinheim-eg.com/cdn/shop/videos/c/vp/85071c8806704603be22828dee32397c/85071c8806704603be22828dee32397c.HD-1080p-7.2Mbps-77449179.mp4?v=0";

const ritualVideo =
  "https://steinheim-eg.com/cdn/shop/videos/c/vp/2d4afb58a5b949a39d20cb5b3fd5e5d5/2d4afb58a5b949a39d20cb5b3fd5e5d5.HD-1080p-7.2Mbps-79305891.mp4?v=0";

const collections = [
  {
    name: "Joy",
    lineKey: "joy" as const,
    href: "/collections/joy",
    image: "/images/nav-menu/products/joy-basin-mixer.png",
    hoverImage: "/images/nav-menu/products/joy-wall-mounted-basin-mixer.png",
  },
  {
    name: "Up",
    lineKey: "up" as const,
    href: "/collections/up",
    image: "/images/nav-menu/products/up-wall-mounted-basin-mixer-v2.png",
    hoverImage: "/images/nav-menu/products/up-basin-mixer-v2.png",
  },
  {
    name: "Art",
    lineKey: "art" as const,
    href: "/collections/art",
    image: "/images/nav-menu/products/art-basin-mixer-v2.png",
    hoverImage: "/images/nav-menu/products/art-free-standing-bath-mixer.png",
  },
  {
    name: "Quatro",
    lineKey: "quatro" as const,
    href: "/collections/quatro",
    image: "/images/nav-menu/products/quatro-concealed-shower-v2.png",
    hoverImage: "/images/nav-menu/products/quatro-tall-basin-mixer-v2.png",
  },
];

function ScrollCue({ label }: { label: string }) {
  return (
    <span className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 text-[10px] uppercase tracking-[0.34em] text-white/55 sm:block">
      {label}
    </span>
  );
}

function CollectionCard({ item, index }: { item: (typeof collections)[number]; index: number }) {
  const t = useTranslations("landing.collections");
  const [hovered, setHovered] = useState(false);

  return (
    <motion.article
      initial={{ opacity: 0, y: 36, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.9, delay: index * 0.08, ease: [0.22, 0.76, 0.2, 1] }}
    >
      <Link
        href={item.href}
        className="group block"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-black shadow-[0_24px_70px_rgba(0,0,0,0.08)] transition duration-[900ms] ease-[cubic-bezier(0.22,0.76,0.2,1)] group-hover:-translate-y-1 group-hover:shadow-[0_34px_90px_rgba(0,0,0,0.14)]">
          <Image
            src={item.image}
            alt={`${item.name} collection`}
            fill
            sizes="(max-width: 768px) 100vw, 25vw"
            className={`object-cover transition-[opacity,transform] duration-[1800ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
              hovered ? "opacity-0 scale-[1.045]" : "opacity-100 scale-100 group-hover:scale-[1.025]"
            }`}
          />
          <Image
            src={item.hoverImage}
            alt={`${item.name} collection lifestyle`}
            fill
            sizes="(max-width: 768px) 100vw, 25vw"
            quality={82}
            className={`object-cover transition-[opacity,transform] duration-[1800ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
              hovered ? "opacity-100 scale-100" : "opacity-0 scale-[1.045]"
            }`}
          />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_58%,rgba(0,0,0,0.16))] opacity-0 transition duration-700 group-hover:opacity-100" />
        </div>
        <h3 className="mt-4 text-center text-[22px] font-semibold leading-none tracking-[-0.035em] text-black sm:mt-5 sm:text-[26px]">
          {item.name}
        </h3>
        <span className="mx-auto mt-3 block h-px w-8 bg-black/20 transition-all duration-700 group-hover:w-16 group-hover:bg-black/60" />
        <p className="mx-auto mt-2 max-w-[320px] text-center text-[13px] leading-[1.5] text-black/55 sm:text-[14px] sm:leading-[1.55]">
          {t(item.lineKey)}
        </p>
      </Link>
    </motion.article>
  );
}

function ProjectCard({ project, index }: { project: ProjectReference; index: number }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 32, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, delay: index * 0.08, ease: [0.22, 0.76, 0.2, 1] }}
      className="w-[82vw] shrink-0 sm:w-[420px] lg:w-[480px]"
    >
      <Link
        href={`/projects/${project.slug}`}
        className="group block"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="relative aspect-[4/5] overflow-hidden rounded-[4px] bg-black">
          <Image
            src={project.cardImage}
            alt={project.name}
            fill
            quality={90}
            sizes="(max-width: 768px) 82vw, 480px"
            className={`object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.22,0.76,0.2,1)] ${
              hovered ? "scale-[1.06]" : "scale-100"
            }`}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6">
            <p className="text-[11px] uppercase tracking-[0.28em] text-white/65">
              {project.location}, {project.country}
            </p>
            <h3 className="mt-3 font-heading text-[24px] leading-tight text-white" style={{ fontStyle: "italic" }}>
              {project.name}
            </h3>
            <span
              className={`mt-4 block h-px bg-white/50 transition-all duration-700 ${
                hovered ? "w-16" : "w-8"
              }`}
            />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function GessiInspiredHome() {
  const t = useTranslations("landing");
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const heroSectionRef = useRef<HTMLElement>(null);
  const [heroPaused, setHeroPaused] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  useAutoplayVideo(heroVideoRef, heroVideo);

  const { scrollYProgress: heroProgress } = useScroll({
    target: heroSectionRef,
    offset: ["start start", "end start"],
  });
  const heroProgressSmooth = useSpring(heroProgress, { stiffness: 100, damping: 30, mass: 0.4 });
  const heroVideoY = useTransform(heroProgressSmooth, [0, 1], ["0%", "22%"]);
  const heroVideoScale = useTransform(heroProgressSmooth, [0, 1], [1, 1.18]);
  const heroTextY = useTransform(heroProgressSmooth, [0, 1], ["0%", "40%"]);
  const heroTextOpacity = useTransform(heroProgressSmooth, [0, 0.7], [1, 0]);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowIntro(false), 950);
    return () => window.clearTimeout(timer);
  }, []);

  const toggleHeroVideo = () => {
    const video = heroVideoRef.current;
    if (!video) return;

    if (video.paused) {
      delete video.dataset.userPaused;
      video.play();
      setHeroPaused(false);
    } else {
      video.dataset.userPaused = "1";
      video.pause();
      setHeroPaused(true);
    }
  };

  return (
    <div className="bg-[#ece9e2] text-[#0a0a0a] text-start">
      <AnimatePresence>
        {showIntro && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 0.76, 0.2, 1] }}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-[#ece9e2]"
          >
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, ease: [0.22, 0.76, 0.2, 1] }}
            >
              <Logo color="dark" size="sm" showWave={false} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <section ref={heroSectionRef} className="relative h-svh min-h-[760px] overflow-hidden bg-black text-white">
        <motion.div style={{ y: heroVideoY, scale: heroVideoScale }} className="absolute inset-x-0 -top-[8%] h-[116%] origin-center">
          <video
            ref={heroVideoRef}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster="/images/lifestyle/hero.png"
            className="h-full w-full object-cover"
          >
            <source src={heroVideo} type="video/mp4" />
          </video>
        </motion.div>
        <div className="absolute inset-0 bg-black/35" />
        <motion.div
          style={{ y: heroTextY, opacity: heroTextOpacity }}
          className="absolute inset-x-0 bottom-[12%] z-10 flex flex-col items-center px-6 text-center"
        >
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2 }}
            className="text-[11px] uppercase tracking-[0.55em] text-white/70"
          >
            {t("hero.eyebrow")}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.38 }}
            className="mt-5 font-heading text-[clamp(3.4rem,9vw,8.8rem)] leading-[0.9] tracking-[-0.045em]"
          >
            {t("hero.headline")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.62 }}
            className="mt-5 max-w-xl text-[15px] leading-[1.9] text-white/72"
          >
            {t("hero.body")}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mt-9 flex flex-wrap justify-center gap-3"
          >
            <Link
              href="/collections"
              className="rounded-full border border-white/50 px-9 py-3.5 text-[13px] font-medium text-white backdrop-blur-sm transition duration-500 hover:bg-white hover:text-black"
            >
              {t("hero.discover")}
            </Link>
            <Link
              href="/collections"
              className="rounded-full border border-white/30 px-9 py-3.5 text-[13px] font-medium text-white transition duration-500 hover:border-white/60"
            >
              {t("hero.viewProducts")}
            </Link>
          </motion.div>
        </motion.div>
        <button
          type="button"
          onClick={toggleHeroVideo}
          aria-label={heroPaused ? t("hero.play") : t("hero.pause")}
          className="absolute bottom-8 right-8 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/45 text-[11px] uppercase tracking-[0.18em] text-white/80 transition duration-500 hover:bg-white hover:text-black"
        >
          {heroPaused ? t("hero.playShort") : "II"}
        </button>
        <ScrollCue label={t("hero.scroll")} />
      </section>

      <section className="overflow-hidden bg-[#ece9e2] px-6 py-20 sm:px-10 lg:px-16 lg:py-24">
        <div className="mx-auto max-w-[1160px]">
          <div className="mb-10 text-center sm:mb-12">
            <h2 className="text-[32px] font-normal leading-tight tracking-[-0.055em] text-black sm:text-[42px] lg:text-[48px]">
              {t("collections.title")}
            </h2>
          </div>

          <div className="mx-auto grid max-w-[980px] gap-x-9 gap-y-12 sm:grid-cols-2 lg:gap-x-12 lg:gap-y-14">
            {collections.map((item, index) => (
              <CollectionCard key={item.name} item={item} index={index} />
            ))}
          </div>
        </div>
      </section>

      <section className="relative min-h-[760px] overflow-hidden bg-black text-white">
        <AutoplayVideo src={ritualVideo} poster="/images/steinheim/final/about-hero.jpg" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative z-10 grid min-h-[760px] items-center gap-12 px-6 py-28 sm:px-10 lg:grid-cols-2 lg:px-24">
          <h2
            className="max-w-3xl text-[clamp(2.7rem,6vw,7rem)] leading-[0.92] tracking-[-0.052em]"
            style={{ fontStyle: "italic" }}
          >
            {t("ritual.headline")}
          </h2>
          <p className="max-w-2xl text-[18px] leading-[1.85] text-white/78">
            {t("ritual.body")}
          </p>
        </div>
      </section>

      <section className="overflow-hidden bg-[#ece9e2] py-10 text-black sm:py-14">
        <div className="mx-auto max-w-[1780px] px-5 sm:px-8 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8 }}
            className="mb-12 text-center"
          >
            <p className="text-[12px] uppercase tracking-[0.34em] text-black/40">{t("projects.eyebrow")}</p>
            <h2 className="mx-auto mt-4 max-w-xl text-[28px] font-normal leading-tight tracking-[-0.03em] text-black sm:text-[36px]">
              {t("projects.headline")}
            </h2>
          </motion.div>
        </div>

        <div className="scroll-snap-x flex gap-5 overflow-x-auto px-5 pb-4 sm:px-8 lg:px-16 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {projectReferences.map((project, index) => (
            <ProjectCard key={project.slug} project={project} index={index} />
          ))}
        </div>

        <div className="mt-10 px-5 text-center">
          <Link
            href="/projects"
            className="inline-flex h-11 items-center rounded-full border border-black/25 px-7 text-[13px] uppercase tracking-[0.2em] text-black transition hover:bg-black hover:text-white"
          >
            {t("projects.viewAll")}
          </Link>
        </div>
      </section>

      <section className="bg-black py-16 text-white sm:py-20">
        <div className="mx-auto max-w-[1780px] px-5 sm:px-8 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8 }}
            className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between"
          >
            <div>
              <p className="text-[12px] uppercase tracking-[0.34em] text-white/40">{t("trade.eyebrow")}</p>
              <h2 className="mt-4 max-w-lg text-[28px] font-normal leading-tight tracking-[-0.03em] sm:text-[36px]">
                {t("trade.headline")}
              </h2>
              <p className="mt-4 max-w-md text-[14px] leading-[1.7] text-white/55">
                {t("trade.body")}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <TradeSetupOpenButton variant="outline-light" label={t("trade.setup")} />
              <Link
                href="/trade"
                className="inline-flex h-[50px] items-center border border-white/25 px-9 text-[10px] font-medium uppercase tracking-[0.15em] text-white transition hover:bg-white hover:text-black"
              >
                {t("trade.visit")}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <ShowroomReel />
    </div>
  );
}
