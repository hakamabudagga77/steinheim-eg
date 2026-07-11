"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { motion, useMotionValueEvent, useScroll, useSpring, useTransform } from "framer-motion";

type StoryCard = { eyebrow: string; title: string; body: string; image: string };

const CARD_VW = 74;
const GAP_VW = 3;
const START_VW = 7;
const END_VW = 7;

export default function OverviewCardsSpread({
  cards,
  onSelectStory,
}: {
  cards: readonly StoryCard[];
  onSelectStory: (title: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });
  const progress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 26,
    mass: 0.4,
  });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setActive(Math.min(cards.length - 1, Math.max(0, Math.floor(v * cards.length))));
  });

  const trackWidth = START_VW + cards.length * CARD_VW + (cards.length - 1) * GAP_VW + END_VW;
  const maxShiftVw = Math.max(0, trackWidth - 100);
  const trackX = useTransform(progress, [0, 1], ["0vw", `-${maxShiftVw}vw`]);

  return (
    <section ref={containerRef} className="relative bg-black" style={{ height: `${cards.length * 100}vh` }}>
      <div className="sticky top-0 flex h-svh flex-col justify-center overflow-hidden pt-[132px] lg:pt-[144px]">
        <div className="mb-8 flex items-end justify-between px-5 sm:px-8 lg:px-16">
          <p className="text-[11px] uppercase tracking-[0.34em] text-white/45">
            {String(active + 1).padStart(2, "0")} / {String(cards.length).padStart(2, "0")}
          </p>
          <p className="hidden text-[11px] uppercase tracking-[0.34em] text-white/45 sm:block">Scroll to explore</p>
        </div>
        <motion.div
          className="flex gap-[3vw]"
          style={{ x: trackX, paddingLeft: `${START_VW}vw`, willChange: "transform" }}
        >
          {cards.map((card, index) => (
            <TrackCard
              key={card.title}
              card={card}
              index={index}
              total={cards.length}
              progress={progress}
              onSelectStory={onSelectStory}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function TrackCard({
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
  const start = index / total;
  const peak = (index + 0.5) / total;
  const end = (index + 1) / total;

  const scale = useTransform(progress, [start, peak, end], [0.88, 1, 0.88], { clamp: true });
  const opacity = useTransform(progress, [start, peak, end], [0.42, 1, 0.42], { clamp: true });
  const textOpacity = useTransform(progress, [start, peak, end], [0, 1, 0], { clamp: true });
  const textY = useTransform(progress, [start, peak, end], [14, 0, 14], { clamp: true });

  return (
    <motion.article
      style={{ scale, opacity, willChange: "transform, opacity" }}
      className="group relative h-[60svh] shrink-0 overflow-hidden rounded-[14px] bg-black text-white lg:h-[68svh]"
    >
      <div style={{ width: `${CARD_VW}vw` }} className="relative h-full">
        <Image
          src={card.image}
          alt={card.title}
          fill
          quality={90}
          sizes="74vw"
          className="object-cover transition duration-[1300ms] group-hover:scale-[1.035]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/10 to-transparent" />
        <motion.div style={{ opacity: textOpacity, y: textY }} className="absolute inset-x-0 bottom-0 p-8 lg:p-12">
          <p className="text-[14px] font-medium uppercase tracking-[0.2em] text-white/80 lg:text-[16px]">
            {card.eyebrow}
          </p>
          <h2 className="mt-5 text-[clamp(1.8rem,4vw,3.4rem)] font-normal tracking-[-0.05em] lg:mt-7">
            {card.title}
          </h2>
          <p className="mt-3 max-w-md text-[15px] leading-[1.55] text-white/72 lg:text-[16px]">{card.body}</p>
          <button
            type="button"
            onClick={() => onSelectStory(card.title)}
            className="mt-5 inline-flex border-b border-white pb-1 text-[16px] font-medium transition hover:text-white/70 cursor-pointer lg:text-[18px]"
          >
            Discover more
          </button>
        </motion.div>
      </div>
    </motion.article>
  );
}
