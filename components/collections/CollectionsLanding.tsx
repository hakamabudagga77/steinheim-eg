"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { collectionLandingImages } from "@/data/images";
import { getAllSeries } from "@/lib/utils";
import { useAutoplayVideo } from "@/lib/useAutoplayVideo";

const collectionsVideo = "/videos/one-yard-jvc-hero.mp4";

const collectionCopy: Record<string, { line: string; family: string }> = {
  joy: {
    family: "Series 60",
    line: "Soft balance for private villas, suites, and warm hospitality rooms.",
  },
  up: {
    family: "Series 50",
    line: "A repeatable modern language for developments and project schedules.",
  },
  art: {
    family: "Series 70",
    line: "Architectural precision for statement bathrooms and design-led spaces.",
  },
  quatro: {
    family: "Series 40",
    line: "Crisp geometry for sharp, contemporary interiors.",
  },
};

export default function CollectionsLanding() {
  const series = getAllSeries();
  const videoRef = useRef<HTMLVideoElement>(null);
  const heroSectionRef = useRef<HTMLElement>(null);
  const [paused, setPaused] = useState(false);
  useAutoplayVideo(videoRef, collectionsVideo);

  const { scrollYProgress: heroProgress } = useScroll({
    target: heroSectionRef,
    offset: ["start start", "end start"],
  });
  const heroProgressSmooth = useSpring(heroProgress, { stiffness: 100, damping: 30, mass: 0.4 });
  const heroVideoY = useTransform(heroProgressSmooth, [0, 1], ["0%", "22%"]);
  const heroVideoScale = useTransform(heroProgressSmooth, [0, 1], [1, 1.18]);

  const toggleVideo = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setPaused(false);
    } else {
      video.pause();
      setPaused(true);
    }
  };

  return (
    <main className="bg-[#ece9e2] text-[#0a0a0a]">
      <section ref={heroSectionRef} className="relative bg-black text-white">
        <div className="sticky top-0 h-svh min-h-[760px] overflow-hidden">
          <motion.div style={{ y: heroVideoY, scale: heroVideoScale }} className="absolute inset-x-0 -top-[8%] h-[116%] origin-center">
            <video
              ref={videoRef}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              poster="/images/steinheim/final/collections-hero.jpg"
              className="h-full w-full object-cover"
            >
              <source src={collectionsVideo} type="video/mp4" />
            </video>
          </motion.div>
          <div className="absolute inset-0 bg-black/34" />
          <button
            type="button"
            onClick={toggleVideo}
            aria-label={paused ? "Play background video" : "Pause background video"}
            className="absolute bottom-8 right-8 z-30 flex h-14 w-14 items-center justify-center rounded-full border border-white/70 text-[11px] uppercase tracking-[0.12em] text-white transition duration-500 hover:bg-white hover:text-black"
          >
            {paused ? "Play" : "II"}
          </button>
        </div>

        <div className="relative z-10 -mt-[100svh]">
          <section className="relative flex h-svh min-h-[760px] items-center justify-center px-6 text-center">
            <div className="absolute left-0 right-0 top-[124px] px-6 text-left sm:px-10 lg:px-16">
              <div className="mx-auto max-w-[1780px]">
                <p className="text-[18px] font-medium text-white">
                  <Link href="/" className="transition hover:text-white/70">Home</Link>
                  <span className="px-2 text-white/75">·</span>
                  <span>Collections</span>
                </p>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 0.76, 0.2, 1] }}
            >
              <p className="text-[clamp(1rem,1.6vw,1.45rem)] uppercase tracking-[0.22em] text-white/82">
                Collections
              </p>
              <h1 className="mt-7 text-[clamp(4.2rem,9vw,8.8rem)] font-normal leading-[0.88] tracking-[-0.055em] text-white">
                Four systems.
              </h1>
            </motion.div>
          </section>

          <section className="flex h-svh items-center justify-center px-6 text-center">
            <motion.h2
              initial={{ opacity: 0, y: 34 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ amount: 0.65, once: false }}
              transition={{ duration: 0.9, ease: [0.22, 0.76, 0.2, 1] }}
              className="max-w-6xl text-[clamp(3rem,6.8vw,7rem)] font-normal leading-[1.04] tracking-[-0.055em] text-white/86"
            >
              Exclusive collections for the most intimate space in living
            </motion.h2>
          </section>

          <section className="flex h-svh items-center px-6 sm:px-10 lg:px-16">
            <div className="mx-auto grid w-full max-w-[1780px] gap-12 lg:grid-cols-2 lg:items-center">
              <motion.h2
                initial={{ opacity: 0, x: -34 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ amount: 0.55, once: false }}
                transition={{ duration: 0.9, ease: [0.22, 0.76, 0.2, 1] }}
                className="max-w-3xl text-[clamp(2.8rem,5.7vw,6rem)] font-normal leading-[1.08] tracking-[-0.055em] text-white"
              >
                Steinheim, synonymous with design in refined bathroom spaces
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, x: 34 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ amount: 0.55, once: false }}
                transition={{ duration: 0.9, delay: 0.08, ease: [0.22, 0.76, 0.2, 1] }}
                className="max-w-2xl text-[clamp(1.15rem,1.55vw,1.7rem)] font-medium leading-[1.55] text-white/88"
              >
                With collections ranging from soft minimal mixers to sharper architectural systems,
                Steinheim creates a complete bathroom language for homes, hotels, designers, and
                developers in Egypt.
              </motion.p>
            </div>
          </section>
        </div>
      </section>

      <section className="bg-[#ece9e2] px-5 py-20 sm:px-8 lg:px-16 lg:py-28">
        <div className="mx-auto max-w-[1780px]">
          <h2 className="mb-12 text-[clamp(2rem,3.4vw,3.5rem)] font-normal tracking-[-0.045em]">
            Steinheim Collections
          </h2>

          <div className="grid gap-x-10 gap-y-16 md:grid-cols-2">
            {series.map((collection, index) => {
              const copy = collectionCopy[collection.id];

              return (
                <motion.article
                  key={collection.id}
                  initial={{ opacity: 0, y: 34 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.72, delay: Math.min(index * 0.08, 0.2) }}
                >
                  <Link href={`/collections/${collection.id}`} className="group block">
                    <div className="relative aspect-[1.47] overflow-hidden bg-black">
                      <Image
                        src={collectionLandingImages[collection.id]}
                        alt={`${collection.name} bathroom collection`}
                        fill
                        quality={92}
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover transition duration-[1400ms] group-hover:scale-[1.035]"
                      />
                    </div>
                    <div className="mt-7">
                      <h3 className="text-[clamp(1.45rem,2vw,2rem)] font-semibold leading-tight tracking-[-0.025em]">
                        {collection.name}
                      </h3>
                      <p className="mt-2 text-[clamp(1rem,1.25vw,1.28rem)] leading-[1.35] text-black">
                        {copy?.line}
                      </p>
                      <p className="mt-1 text-[14px] text-black/48">{copy?.family}</p>
                    </div>
                  </Link>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
