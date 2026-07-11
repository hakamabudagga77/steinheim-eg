"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { getFinishDiscImage, getProductImage } from "@/data/images";
import Logo from "@/components/ui/Logo";
import FinishPlanetsSection from "@/components/home/FinishPlanetsSection";

const heroVideo =
  "https://steinheim-eg.com/cdn/shop/videos/c/vp/85071c8806704603be22828dee32397c/85071c8806704603be22828dee32397c.HD-1080p-7.2Mbps-77449179.mp4?v=0";

const ritualVideo =
  "https://steinheim-eg.com/cdn/shop/videos/c/vp/2d4afb58a5b949a39d20cb5b3fd5e5d5/2d4afb58a5b949a39d20cb5b3fd5e5d5.HD-1080p-7.2Mbps-79305891.mp4?v=0";

const collections = [
  {
    name: "Joy",
    href: "/collections/joy",
    image: "/images/collections/home/joy-card-v3.jpeg",
    line: "Soft balance for private villas, suites, and warm hospitality rooms.",
  },
  {
    name: "Up",
    href: "/collections/up",
    image: "/images/collections/home/up-card-v3.png",
    line: "A repeatable modern language for developments and project schedules.",
  },
  {
    name: "Art",
    href: "/collections/art",
    image: "/images/collections/home/art-card-v4.png",
    line: "Architectural precision for statement bathrooms and design-led spaces.",
  },
  {
    name: "Quatro",
    href: "/collections/quatro",
    image: "/images/collections/home/quatro-card-v5.png",
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

const finishIds = ["chrome", "brushed-nickel", "matte-black", "brushed-gold", "coffee-gold"];

function ScrollCue() {
  return (
    <span className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 text-[10px] uppercase tracking-[0.34em] text-white/55 sm:block">
      Scroll
    </span>
  );
}

export default function GessiInspiredHome() {
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const [heroPaused, setHeroPaused] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const productImage = getProductImage("joy-basin-mixer", "brushed-gold")
    ?? getProductImage("joy-basin-mixer", "chrome");

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

      <section className="relative h-svh min-h-[760px] overflow-hidden bg-black text-white">
        <video
          ref={heroVideoRef}
          autoPlay
          muted
          loop
          playsInline
          poster="/images/lifestyle/hero.png"
          className="absolute inset-0 h-full w-full scale-[1.02] object-cover"
        >
          <source src={heroVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/35" />
        <div className="absolute inset-x-0 bottom-[12%] z-10 flex flex-col items-center px-6 text-center">
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
        </div>
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
              <motion.article
                key={item.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.7, delay: index * 0.06 }}
              >
                <Link href={item.href} className="group block">
                  <div className="relative aspect-[0.92] overflow-hidden rounded-[22px] bg-black">
                    <Image
                      src={item.image}
                      alt={`${item.name} collection`}
                      fill
                      sizes="(max-width: 768px) 100vw, 25vw"
                      className="object-cover transition duration-[1400ms] group-hover:scale-[1.045]"
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
            ))}
          </div>
        </div>
      </section>

      <section className="relative min-h-[760px] overflow-hidden bg-black text-white">
        <video
          autoPlay
          muted
          loop
          playsInline
          poster="/images/steinheim/final/about-hero.jpg"
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src={ritualVideo} type="video/mp4" />
        </video>
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

      <section className="bg-white px-5 py-24 sm:px-8 lg:px-16 lg:py-32">
        <div className="mx-auto grid max-w-[1500px] gap-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="relative min-h-[520px] bg-[#ece9e2]">
            {productImage ? (
              <Image
                src={productImage}
                alt="Joy basin mixer in brushed gold"
                fill
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-contain p-10 sm:p-16"
              />
            ) : null}
          </div>
          <div>
            <p className="text-[14px] text-black/50">Steinheim Area Pro · Series 60</p>
            <h2
              className="mt-8 text-[clamp(2.4rem,5vw,5.8rem)] leading-[0.95] tracking-[-0.052em]"
              style={{ fontStyle: "italic" }}
            >
              Joy Basin Mixer
            </h2>
            <p className="mt-5 max-w-xl text-[19px] leading-[1.75] text-black/62">
              A calm, balanced mixer for premium bathrooms, guest suites, and repeatable project schedules.
            </p>
            <div className="mt-12 max-w-md overflow-hidden rounded-[18px] border border-black/8 bg-[#ece9e2]">
              {finishIds.map((finish) => {
                const disc = getFinishDiscImage(finish);
                const label = finish
                  .split("-")
                  .map((part) => part[0].toUpperCase() + part.slice(1))
                  .join(" ");
                return (
                  <div key={finish} className="flex items-center gap-5 border-b border-black/6 px-5 py-4 last:border-b-0">
                    <span className="relative h-9 w-9 overflow-hidden rounded-full bg-black/10">
                      {disc ? <Image src={disc} alt="" fill sizes="36px" className="object-cover" /> : null}
                    </span>
                    <span className="text-[18px]">{label}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-12 flex flex-wrap gap-3">
              <Link href="/products/joy-basin-mixer" className="rounded-full border border-black/30 px-10 py-4 text-[13px] font-medium transition hover:bg-black hover:text-white">
                Discover more
              </Link>
              <Link href="/trade" className="rounded-full border border-black/15 px-10 py-4 text-[13px] text-black/60 transition hover:border-black/40">
                Add to project
              </Link>
            </div>
          </div>
        </div>
      </section>

      <FinishPlanetsSection />

      <section className="bg-[#ece9e2] px-5 py-20 sm:px-8 lg:px-16">
        <div className="mx-auto grid max-w-[1780px] border-y border-black/12 lg:grid-cols-3">
          {[
            ["Assistance", "Do you need assistance or would you like to request information?", "/contact"],
            ["Project studio", "Build a trade scope and prepare a Steinheim specification board.", "/trade"],
            ["Catalogues", "Explore collections, finishes, and product families.", "/collections"],
          ].map(([title, body, href]) => (
            <Link key={title} href={href} className="group flex min-h-[170px] items-center justify-between gap-8 border-b border-black/12 px-8 py-8 transition hover:bg-white lg:border-b-0 lg:border-r lg:last:border-r-0">
              <span>
                <span className="block text-[22px] font-semibold">{title}</span>
                <span className="mt-4 block max-w-sm text-[16px] leading-[1.65] text-black/62">{body}</span>
              </span>
              <span className="text-[38px] transition group-hover:translate-x-2">→</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
