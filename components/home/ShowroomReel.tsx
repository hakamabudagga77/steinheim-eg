"use client";

import { motion } from "framer-motion";
import AutoplayVideo from "@/components/ui/AutoplayVideo";
import { Link } from "@/i18n/navigation";

const clips: Array<{
  src: string;
  poster: string;
  caption: string;
  orientation: "portrait" | "landscape";
}> = [
  {
    src: "/videos/showroom/showroom-1.mp4",
    poster: "/images/showroom-1-poster.jpg",
    caption: "The showroom floor",
    orientation: "portrait",
  },
  {
    src: "/videos/showroom/showroom-2.mp4",
    poster: "/images/showroom-2-poster.jpg",
    caption: "Finishes, in hand",
    orientation: "landscape",
  },
  {
    src: "/videos/showroom/showroom-3.mp4",
    poster: "/images/showroom-3-poster.jpg",
    caption: "Every mechanism, tested",
    orientation: "portrait",
  },
  {
    src: "/videos/showroom/showroom-4.mp4",
    poster: "/images/showroom-4-poster.jpg",
    caption: "A walk through Cairo",
    orientation: "portrait",
  },
  {
    src: "/videos/showroom/showroom-5.mp4",
    poster: "/images/showroom-5-poster.jpg",
    caption: "Where projects begin",
    orientation: "portrait",
  },
];

export default function ShowroomReel() {
  return (
    <section className="bg-black py-24 text-white sm:py-32">
      <div className="mx-auto max-w-[1780px] px-5 sm:px-8 lg:px-16">
        <div className="mb-12 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-[12px] uppercase tracking-[0.34em] text-white/45">Inside Steinheim</p>
            <h2 className="mt-4 max-w-2xl font-heading text-[clamp(2.6rem,5.5vw,5.4rem)] font-normal leading-[0.95] tracking-[-0.05em]">
              The showroom, as it is.
            </h2>
            <p className="mt-5 max-w-md text-[15px] leading-[1.75] text-white/60">
              Unfiltered footage from our Cairo showroom floor — the finishes, the mechanisms,
              and the space where clients specify a complete bathroom in person.
            </p>
          </div>
          <Link
            href="/contact"
            className="rounded-full border border-white/30 px-7 py-3 text-[13px] transition hover:border-white/70"
          >
            Book a showroom visit
          </Link>
        </div>

        <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 sm:-mx-8 sm:px-8 lg:-mx-16 lg:px-16 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {clips.map((clip, index) => (
            <motion.div
              key={clip.src}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: Math.min(index * 0.07, 0.28) }}
              className={`group relative shrink-0 snap-start overflow-hidden rounded-[18px] bg-[#111] ${
                clip.orientation === "portrait" ? "aspect-[9/16] w-[62vw] sm:w-[300px]" : "aspect-[16/9] w-[86vw] sm:w-[560px]"
              }`}
            >
              <AutoplayVideo
                src={clip.src}
                poster={clip.poster}
                className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <p className="absolute bottom-5 left-5 right-5 text-[15px] leading-tight text-white/90">
                {clip.caption}
              </p>
              <span className="absolute right-5 top-5 text-[11px] tracking-[0.2em] text-white/50">
                0{index + 1}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
