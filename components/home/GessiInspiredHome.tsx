"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useScroll, useSpring, useTransform } from "framer-motion";
import { Link } from "@/i18n/navigation";
import Logo from "@/components/ui/Logo";
import FinishPlanetsSection from "@/components/home/FinishPlanetsSection";
import AutoplayVideo from "@/components/ui/AutoplayVideo";
import { useAutoplayVideo } from "@/lib/useAutoplayVideo";

const heroVideo =
  "https://steinheim-eg.com/cdn/shop/videos/c/vp/85071c8806704603be22828dee32397c/85071c8806704603be22828dee32397c.HD-1080p-7.2Mbps-77449179.mp4?v=0";

const ritualVideo =
  "https://steinheim-eg.com/cdn/shop/videos/c/vp/2d4afb58a5b949a39d20cb5b3fd5e5d5/2d4afb58a5b949a39d20cb5b3fd5e5d5.HD-1080p-7.2Mbps-79305891.mp4?v=0";

const collections = [
  {
    name: "Joy",
    href: "/collections/joy",
    image: "/images/collections/home/joy-card-v3.jpeg",
    hoverImage: "/images/collections/home/joy-bath-hover.png",
    line: "Soft balance for private villas, suites, and warm hospitality rooms.",
  },
  {
    name: "Up",
    href: "/collections/up",
    image: "/images/collections/home/up-card-v3.png",
    hoverImage: "/images/collections/home/up-bath-hover.png",
    line: "A repeatable modern language for developments and project schedules.",
  },
  {
    name: "Art",
    href: "/collections/art",
    image: "/images/collections/home/art-card-v4.png",
    hoverImage: "/images/collections/home/art-bath-hover.png",
    line: "Architectural precision for statement bathrooms and design-led spaces.",
  },
  {
    name: "Quatro",
    href: "/collections/quatro",
    image: "/images/collections/home/quatro-card-v5.png",
    hoverImage: "/images/collections/home/quatro-shower-hover.png",
    line: "Crisp geometry for sharp, contemporary interiors.",
  },
];

const references = [
  {
    title: "Private residences",
    place: "Cairo and coastal homes",
    image: "/images/lifestyle/14.png",
  },
  {
    title: "Hospitality suites",
    place: "Hotels, villas, serviced apartments",
    image: "/images/lifestyle/21.png",
  },
  {
    title: "Development schedules",
    place: "Repeatable premium specifications",
    image: "/images/generated/gessi/steinheim-specification-story.png",
  },
  {
    title: "Show bathrooms",
    place: "Owner units and sales galleries",
    image: "/images/generated/gessi/steinheim-wellness-architecture.png",
  },
];

function ScrollCue() {
  return (
    <span className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 text-[10px] uppercase tracking-[0.34em] text-white/55 sm:block">
      Scroll
    </span>
  );
}

function CollectionCard({ item, index }: { item: (typeof collections)[number]; index: number }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay: index * 0.06 }}
    >
      <Link
        href={item.href}
        className="group block"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="relative aspect-[0.92] overflow-hidden rounded-[22px] bg-black">
          <Image
            src={item.image}
            alt={`${item.name} collection`}
            fill
            sizes="(max-width: 768px) 100vw, 25vw"
            priority
            className={`object-cover transition-[opacity,transform] duration-[1800ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
              hovered ? "opacity-0 scale-[1.03]" : "opacity-100 scale-100"
            }`}
          />
          <Image
            src={item.hoverImage}
            alt={`${item.name} collection lifestyle`}
            fill
            sizes="(max-width: 768px) 100vw, 25vw"
            quality={82}
            priority
            className={`object-cover transition-[opacity,transform] duration-[1800ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
              hovered ? "opacity-100 scale-100" : "opacity-0 scale-[1.03]"
            }`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
          <h3 className="absolute bottom-6 left-6 font-heading text-[42px] leading-none text-white">
            {item.name}
          </h3>
        </div>
        <p className="mt-5 text-[20px] font-medium leading-tight">{item.name}</p>
        <p className="mt-1 max-w-[320px] text-[15px] leading-[1.55] text-black/62">{item.line}</p>
      </Link>
    </motion.article>
  );
}

export default function GessiInspiredHome() {
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
      video.play();
      setHeroPaused(false);
    } else {
      video.pause();
      setHeroPaused(true);
    }
  };

  return (
    <div className="bg-[#ece9e2] text-[#0a0a0a]">
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
            Steinheim Egypt
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.38 }}
            className="mt-5 font-heading text-[clamp(3.4rem,9vw,8.8rem)] leading-[0.9] tracking-[-0.045em]"
          >
            Water, designed.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.62 }}
            className="mt-5 max-w-xl text-[15px] leading-[1.9] text-white/72"
          >
            Premium bathroom systems for homes, hospitality, and design-led projects in Egypt.
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
              Discover more
            </Link>
            <Link
              href="/collections"
              className="rounded-full border border-white/30 px-9 py-3.5 text-[13px] font-medium text-white transition duration-500 hover:border-white/60"
            >
              View products
            </Link>
          </motion.div>
        </motion.div>
        <button
          type="button"
          onClick={toggleHeroVideo}
          aria-label="Pause background video"
          className="absolute bottom-8 right-8 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/45 text-[11px] uppercase tracking-[0.18em] text-white/80 transition duration-500 hover:bg-white hover:text-black"
        >
          {heroPaused ? "Play" : "II"}
        </button>
        <ScrollCue />
      </section>

      <section className="bg-[#ece9e2] px-5 py-24 sm:px-8 lg:px-16 lg:py-32">
        <div className="mx-auto max-w-[1780px]">
          <div className="mb-12 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <p className="text-[12px] uppercase tracking-[0.34em] text-black/45">Collections</p>
              <h2
                className="mt-4 max-w-4xl text-[clamp(2.8rem,6.3vw,7.4rem)] font-normal leading-[0.9] tracking-[-0.055em]"
                style={{ fontStyle: "italic" }}
              >
                Icons for the bathroom.
              </h2>
            </div>
            <Link href="/collections" className="rounded-full border border-black/30 px-7 py-3 text-[13px] transition hover:bg-black hover:text-white">
              View all
            </Link>
          </div>

          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
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
            The quiet ritual of precision.
          </h2>
          <p className="max-w-2xl text-[18px] leading-[1.85] text-white/78">
            Steinheim is specified where the bathroom must feel resolved: proportion, finish, mechanism,
            and long-term reliability working as one complete language.
          </p>
        </div>
      </section>

      <section className="bg-[#ece9e2] px-5 py-24 sm:px-8 lg:px-16 lg:py-32">
        <div className="mx-auto max-w-[1780px]">
          <div className="mb-14 text-center">
            <p className="text-[12px] uppercase tracking-[0.34em] text-black/40">References</p>
            <h2
              className="mx-auto mt-5 max-w-4xl text-[clamp(2.5rem,5.5vw,6.6rem)] leading-[0.92] tracking-[-0.052em]"
              style={{ fontStyle: "italic" }}
            >
              Designed for projects that need permanence.
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {references.map((item) => (
              <Link key={item.title} href="/projects" className="group block">
                <div className="relative aspect-[1.35] overflow-hidden rounded-[14px] bg-black">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 25vw"
                    className="object-cover transition duration-[1300ms] group-hover:scale-[1.04]"
                  />
                </div>
                <h3 className="mt-5 font-heading text-[20px] leading-tight" style={{ fontStyle: "italic" }}>{item.title}</h3>
                <p className="mt-1 text-[14px] text-black/50">{item.place}</p>
              </Link>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link href="/projects" className="rounded-full border border-black/25 px-8 py-3.5 text-[13px] transition hover:bg-black hover:text-white">
              Discover more
            </Link>
          </div>
        </div>
      </section>

      <FinishPlanetsSection />
    </div>
  );
}
