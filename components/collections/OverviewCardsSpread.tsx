"use client";

import Image from "next/image";
import { motion } from "framer-motion";

type StoryCard = { eyebrow: string; title: string; body: string; image: string };

export default function OverviewCardsSpread({
  cards,
  onSelectStory,
}: {
  cards: readonly StoryCard[];
  onSelectStory: (title: string) => void;
}) {
  return (
    <section className="relative bg-[#ece9e2] px-5 py-20 sm:px-8 lg:px-16 lg:py-28">
      <div className="mx-auto grid w-full max-w-[1780px] gap-6 md:grid-cols-3">
        {cards.map((card, index) => (
          <StoryCard key={card.title} card={card} index={index} onSelectStory={onSelectStory} />
        ))}
      </div>
    </section>
  );
}

function StoryCard({
  card,
  index,
  onSelectStory,
}: {
  card: StoryCard;
  index: number;
  onSelectStory: (title: string) => void;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay: index * 0.06, ease: [0.22, 0.76, 0.2, 1] }}
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
