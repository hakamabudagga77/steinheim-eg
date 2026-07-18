"use client";

import { useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";

export type WorldCardData = {
  eyebrow: string;
  title: string;
  image: string;
  hoverImage?: string;
  href: string;
};

export default function WorldCard({ card }: { card: WorldCardData }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={card.href}
      className="group block"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-black">
        <Image
          src={card.image}
          alt={card.title}
          fill
          sizes="(min-width: 1280px) 24vw, (min-width: 768px) 48vw, 100vw"
          className={`object-cover transition-[opacity,transform] duration-[1600ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
            card.hoverImage && hovered ? "opacity-0 scale-[1.03]" : "opacity-100 scale-100"
          }`}
        />
        {card.hoverImage ? (
          <Image
            src={card.hoverImage}
            alt={`${card.title} detail`}
            fill
            sizes="(min-width: 1280px) 24vw, (min-width: 768px) 48vw, 100vw"
            quality={82}
            className={`object-cover transition-[opacity,transform] duration-[1600ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
              hovered ? "opacity-100 scale-100" : "opacity-0 scale-[1.03]"
            }`}
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/58 via-black/8 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6 text-white">
          <p className="text-[10px] uppercase tracking-[0.34em] text-white/62">{card.eyebrow}</p>
          <p className="mt-3 text-[28px] font-light leading-tight tracking-[-0.04em]">{card.title}</p>
          <span className="mt-5 inline-block border-b border-white/70 pb-1 text-[13px]">Discover more</span>
        </div>
      </div>
    </Link>
  );
}
