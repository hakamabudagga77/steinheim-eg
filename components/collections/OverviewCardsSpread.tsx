"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";

type StoryCard = { eyebrow: string; title: string; body: string; image: string };

const CARD_OFFSETS = ["55%", "0%", "-55%"];

export default function OverviewCardsSpread({
  cards,
  onSelectStory,
}: {
  cards: readonly StoryCard[];
  onSelectStory: (title: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 22,
    mass: 0.4,
  });

  return (
    <section ref={containerRef} className="relative" style={{ height: "220vh" }}>
      <div className="sticky top-0 flex h-svh items-center overflow-hidden px-5 sm:px-8 lg:px-16">
        <div className="mx-auto grid w-full max-w-[1780px] gap-6 md:grid-cols-3">
          {cards.map((card, index) => (
            <SpreadCard
              key={card.title}
              card={card}
              index={index}
              scrollYProgress={smoothProgress}
              onSelectStory={onSelectStory}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function SpreadCard({
  card,
  index,
  scrollYProgress,
  onSelectStory,
}: {
  card: StoryCard;
  index: number;
  scrollYProgress: ReturnType<typeof useScroll>["scrollYProgress"];
  onSelectStory: (title: string) => void;
}) {
  const x = useTransform(scrollYProgress, [0, 0.45, 1], [CARD_OFFSETS[index], "0%", "0%"], { clamp: true });
  const opacity = useTransform(scrollYProgress, [0, 0.3, 1], [0, 1, 1], { clamp: true });
  const scale = useTransform(scrollYProgress, [0, 0.45, 1], [0.88, 1, 1], { clamp: true });
  const textOpacity = useTransform(scrollYProgress, [0.35, 0.6, 1], [0, 1, 1], { clamp: true });
  const textY = useTransform(scrollYProgress, [0.35, 0.6, 1], [16, 0, 0], { clamp: true });

  return (
    <motion.article
      style={{ x, opacity, scale, willChange: "transform, opacity" }}
      className="group relative min-h-[560px] overflow-hidden rounded-[14px] bg-black text-white lg:min-h-[640px]"
    >
      <Image
        src={card.image}
        alt={card.title}
        fill
        quality={90}
        sizes="(max-width: 768px) 100vw, 33vw"
        className="object-cover transition duration-[1300ms] group-hover:scale-[1.035]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      <motion.div style={{ opacity: textOpacity, y: textY }} className="absolute inset-x-0 bottom-0 p-8">
        <p className="text-[20px] font-medium uppercase text-white/86">{card.eyebrow}</p>
        <h2 className="mt-8 text-[clamp(2rem,3vw,3.1rem)] font-normal tracking-[-0.05em]">{card.title}</h2>
        <p className="mt-3 max-w-sm text-[16px] leading-[1.55] text-white/72">{card.body}</p>
        <button
          type="button"
          onClick={() => onSelectStory(card.title)}
          className="mt-5 inline-flex border-b border-white pb-1 text-[18px] font-medium transition hover:text-white/70 cursor-pointer"
        >
          Discover more
        </button>
      </motion.div>
    </motion.article>
  );
}
