"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useState } from "react";

const seriesImages: Record<string, Array<{ src: string; position: string }>> = {
  joy: [
    { src: "/images/collections/home/joy-card-v3.jpeg", position: "50% 40%" },
    { src: "/images/collections/home/joy-bath-hover.png", position: "50% 40%" },
  ],
  up: [
    { src: "/images/collections/home/up-card-v3.png", position: "50% 40%" },
    { src: "/images/collections/home/up-bath-hover.png", position: "50% 40%" },
  ],
  art: [
    { src: "/images/collections/home/art-card-v4.png", position: "50% 30%" },
    { src: "/images/collections/home/art-bath-hover.png", position: "50% 30%" },
  ],
  quatro: [
    { src: "/images/collections/home/quatro-card-v5.png", position: "50% 35%" },
    { src: "/images/collections/home/quatro-shower-hover.png", position: "50% 35%" },
  ],
};

const seriesItems = [
  { id: "joy", href: "/collections/joy" },
  { id: "up", href: "/collections/up" },
  { id: "art", href: "/collections/art" },
  { id: "quatro", href: "/collections/quatro" },
];

function CollectionCard({
  series,
  index,
}: {
  series: typeof seriesItems[0];
  index: number;
}) {
  const tc = useTranslations("collections");
  const images = seriesImages[series.id];
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, delay: index * 0.06, ease: [0.22, 0.76, 0.2, 1] }}
    >
      <Link
        href={series.href}
        className="group relative block aspect-[4/5] overflow-hidden bg-[#34312d]"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {images.map((img, i) => (
          <Image
            key={img.src}
            src={img.src}
            alt={`${tc(`${series.id}.name`)} collection`}
            fill
            quality={94}
            sizes="(max-width: 640px) 50vw, 25vw"
            priority={i === 0}
            className={`object-cover transition-[opacity,transform] duration-[2000ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
              (hovered ? i === 1 : i === 0) ? "opacity-100 scale-100" : "opacity-0 scale-[1.03]"
            }`}
            style={{ objectPosition: img.position }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-transparent transition-opacity duration-500 group-hover:opacity-60" />

        <div className="absolute inset-x-0 top-0 p-[14px] sm:p-[18px] lg:p-[22px]">
          <h3 className="font-heading text-[26px] font-normal leading-none tracking-[0.01em] text-white sm:text-[30px] lg:text-[36px]">
            {tc(`${series.id}.name`)}
          </h3>
        </div>

        <div className="absolute bottom-[14px] right-[14px] text-white/60 transition-all duration-300 group-hover:text-white group-hover:translate-x-[2px] sm:bottom-[18px] sm:right-[18px]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
      </Link>
    </motion.div>
  );
}

export default function CollectionGrid() {
  return (
    <section className="bg-white px-[10px] py-[10px] sm:px-[12px] sm:py-[12px] lg:px-[14px] lg:py-[14px]">
      <div className="grid grid-cols-2 gap-[10px] sm:gap-[12px] lg:grid-cols-4 lg:gap-[14px]">
        {seriesItems.map((series, index) => (
          <CollectionCard key={series.id} series={series} index={index} />
        ))}
      </div>
    </section>
  );
}
