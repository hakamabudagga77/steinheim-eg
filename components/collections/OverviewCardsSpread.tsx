"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";

type StoryCard = { eyebrow: string; title: string; body: string; image: string };

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
  const progress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 26,
    mass: 0.4,
  });

  return (
    <section ref={containerRef} className="relative bg-black" style={{ height: "180vh" }}>
      <div className="sticky top-0 flex h-svh flex-col justify-center overflow-hidden px-5 pt-[132px] sm:px-8 lg:px-16 lg:pt-[144px]">
        <div className="mx-auto grid w-full max-w-[1780px] gap-6 md:grid-cols-3">
          {cards.map((card, index) => (
            <RevealCard
              key={card.title}
              card={card}
              index={index}
              total={cards.length}
              progress={progress}
              onSelectStory={onSelectStory}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function RevealCard({
  card,
  index,
  total,
  progress,
  onSelectStory,
}: {
  card: StoryCard;
  index: number;
  total: number;
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
  onSelectStory: (title: string) => void;
}) {
  const stagger = total > 1 ? index / (total - 1) : 0;
  const start = stagger * 0.4;
  const end = start + 0.4;

  const y = useTransform(progress, [start, end], [48, 0], { clamp: true });
  const opacity = useTransform(progress, [start, end], [0, 1], { clamp: true });
  const scale = useTransform(progress, [start, end], [0.94, 1], { clamp: true });

  return (
    <motion.article
      style={{ y, opacity, scale, willChange: "transform, opacity" }}
      className="group relative h-[64svh] overflow-hidden rounded-[14px] bg-black text-white lg:h-[68svh]"
    >
      <Image
        src={card.image}
        alt={card.title}
        fill
        quality={90}
        sizes="(max-width: 768px) 100vw, 33vw"
        className="object-cover transition duration-[1300ms] group-hover:scale-[1.035]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-6 lg:p-8">
        <p className="text-[13px] font-medium uppercase tracking-[0.2em] text-white/80 lg:text-[14px]">
          {card.eyebrow}
        </p>
        <h2 className="mt-4 text-[clamp(1.6rem,2.6vw,2.4rem)] font-normal tracking-[-0.05em] lg:mt-5">
          {card.title}
        </h2>
        <p className="mt-2 max-w-sm text-[14px] leading-[1.55] text-white/72 lg:text-[15px]">{card.body}</p>
        <button
          type="button"
          onClick={() => onSelectStory(card.title)}
          className="mt-4 inline-flex border-b border-white pb-1 text-[14px] font-medium transition hover:text-white/70 cursor-pointer lg:text-[16px]"
        >
          Discover more
        </button>
      </div>
    </motion.article>
  );
}
