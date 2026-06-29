"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const seriesItems = [
  {
    id: "joy",
    href: "/collections/joy",
    image: "/images/collections/home/joy-card-v3.jpeg",
    objectPosition: "50% 40%",
  },
  {
    id: "up",
    href: "/collections/up",
    image: "/images/collections/home/up-card-v3.png",
    objectPosition: "50% 40%",
  },
  {
    id: "art",
    href: "/collections/art",
    image: "/images/collections/home/art-card-v3.png",
    objectPosition: "50% 35%",
  },
  {
    id: "quatro",
    href: "/collections/quatro",
    image: "/images/collections/home/quatro-card-v3.png",
    objectPosition: "50% 45%",
  },
];

export default function CollectionGrid() {
  const tc = useTranslations("collections");

  return (
    <section className="bg-white px-[10px] py-[10px] sm:px-[12px] sm:py-[12px] lg:px-[14px] lg:py-[14px]">
      <div className="grid grid-cols-2 gap-[10px] sm:gap-[12px] lg:grid-cols-4 lg:gap-[14px]">
        {seriesItems.map((series, index) => (
          <motion.div
            key={series.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.6, delay: index * 0.06, ease: [0.22, 0.76, 0.2, 1] }}
          >
            <Link
              href={series.href}
              className="group relative block aspect-[4/5] overflow-hidden bg-[#34312d]"
            >
              <Image
                src={series.image}
                alt={`${tc(`${series.id}.name`)} collection`}
                fill
                quality={94}
                sizes="(max-width: 640px) 50vw, 25vw"
                className="object-cover transition-all duration-[1600ms] ease-out group-hover:scale-[1.04] group-hover:brightness-[0.85]"
                style={{ objectPosition: series.objectPosition }}
              />
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
        ))}
      </div>
    </section>
  );
}
