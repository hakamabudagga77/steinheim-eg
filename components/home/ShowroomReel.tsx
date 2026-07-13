"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import AutoplayVideo from "@/components/ui/AutoplayVideo";

const clips: Array<{
  src: string;
  poster: string;
  orientation: "portrait" | "landscape";
}> = [
  { src: "/videos/showroom/showroom-1.mp4", poster: "/images/showroom-1-poster.jpg", orientation: "portrait" },
  { src: "/videos/showroom/showroom-2.mp4", poster: "/images/showroom-2-poster.jpg", orientation: "landscape" },
  { src: "/videos/showroom/showroom-3.mp4", poster: "/images/showroom-3-poster.jpg", orientation: "portrait" },
  { src: "/videos/showroom/showroom-4.mp4", poster: "/images/showroom-4-poster.jpg", orientation: "portrait" },
  { src: "/videos/showroom/showroom-5.mp4", poster: "/images/showroom-5-poster.jpg", orientation: "portrait" },
];

export default function ShowroomReel() {
  const [paused, setPaused] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [sweepIndex, setSweepIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setSweepIndex((i) => (i + 1) % clips.length);
    }, 2600);
    return () => window.clearInterval(id);
  }, []);

  const spotlightIndex = hoveredIndex ?? sweepIndex;

  return (
    <section className="overflow-hidden bg-black py-24 text-white sm:py-32">
      <div className="mx-auto max-w-[1780px] px-5 sm:px-8 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8 }}
          className="mb-12"
        >
          <p className="text-[12px] uppercase tracking-[0.34em] text-white/45">Inside Steinheim</p>
          <h2 className="mt-4 max-w-2xl font-heading text-[clamp(2.6rem,5.5vw,5.4rem)] font-normal leading-[0.95] tracking-[-0.05em]">
            The showroom, as it is.
          </h2>
          <p className="mt-5 max-w-md text-[15px] leading-[1.75] text-white/60">
            Unfiltered footage from our Cairo showroom floor — the finishes, the mechanisms,
            and the space where clients specify a complete bathroom in person.
          </p>
        </motion.div>
      </div>

      <div
        className="flex w-max gap-4 pl-5 sm:pl-8 lg:pl-16"
        style={{
          animation: "marquee-scroll 34s linear infinite",
          animationPlayState: paused ? "paused" : "running",
        }}
        onPointerEnter={(e) => {
          if (e.pointerType === "mouse") setPaused(true);
        }}
        onPointerLeave={(e) => {
          if (e.pointerType === "mouse") {
            setPaused(false);
            setHoveredIndex(null);
          }
        }}
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
        onPointerCancel={() => setPaused(false)}
      >
        {[...clips, ...clips].map((clip, index) => {
          const clipIndex = index % clips.length;
          const isActive = spotlightIndex === clipIndex;

          return (
            <motion.div
              key={`${clip.src}-${index}`}
              onPointerEnter={(e) => {
                if (e.pointerType === "mouse") setHoveredIndex(clipIndex);
              }}
              animate={{
                opacity: isActive ? 1 : 0.45,
                scale: isActive ? 1.045 : 0.97,
              }}
              transition={{ duration: 0.6, ease: [0.22, 0.76, 0.2, 1] }}
              className={`group relative shrink-0 overflow-hidden rounded-[18px] bg-[#111] ${
                clip.orientation === "portrait" ? "aspect-[9/16] w-[62vw] sm:w-[300px]" : "aspect-[16/9] w-[86vw] sm:w-[560px]"
              }`}
            >
              <AutoplayVideo src={clip.src} poster={clip.poster} className="h-full w-full object-cover" />
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
