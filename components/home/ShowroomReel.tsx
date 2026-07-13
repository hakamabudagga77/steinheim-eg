"use client";

import { useEffect, useRef, useState } from "react";
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
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const centeredRef = useRef<number | null>(null);
  const resumeTimeoutRef = useRef<number | undefined>(undefined);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [centeredIndex, setCenteredIndex] = useState<number | null>(null);

  const pause = () => {
    pausedRef.current = true;
    window.clearTimeout(resumeTimeoutRef.current);
    // Safety net: a mobile browser can miss a matching pointerup/pointercancel,
    // so never let the marquee stay paused forever.
    resumeTimeoutRef.current = window.setTimeout(() => {
      pausedRef.current = false;
    }, 2500);
  };

  const resume = () => {
    pausedRef.current = false;
    window.clearTimeout(resumeTimeoutRef.current);
  };

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let frame: number;
    let lastCenterCheck = 0;
    const speed = 0.55;

    const step = (timestamp: number) => {
      if (!pausedRef.current) {
        const singleSetWidth = track.scrollWidth / 2;
        const next = track.scrollLeft + speed;
        track.scrollLeft = next >= singleSetWidth ? next - singleSetWidth : next;
      }

      if (timestamp - lastCenterCheck > 120) {
        lastCenterCheck = timestamp;
        const trackRect = track.getBoundingClientRect();
        const center = trackRect.left + trackRect.width / 2;
        let closest: number | null = null;
        let closestDistance = Infinity;
        Array.from(track.children).forEach((child, idx) => {
          const rect = (child as HTMLElement).getBoundingClientRect();
          const distance = Math.abs(rect.left + rect.width / 2 - center);
          if (distance < closestDistance) {
            closestDistance = distance;
            closest = idx;
          }
        });
        if (closest !== centeredRef.current) {
          centeredRef.current = closest;
          setCenteredIndex(closest);
        }
      }

      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(resumeTimeoutRef.current);
    };
  }, []);

  const activeIndex = hoveredIndex ?? centeredIndex;

  return (
    <section className="bg-black py-24 text-white sm:py-32">
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

        <div
          ref={trackRef}
          onPointerEnter={(e) => {
            if (e.pointerType === "mouse") pause();
          }}
          onPointerLeave={(e) => {
            if (e.pointerType === "mouse") {
              resume();
              setHoveredIndex(null);
            }
          }}
          onPointerDown={() => pause()}
          onPointerUp={() => resume()}
          onPointerCancel={() => resume()}
          className="-mx-5 flex gap-4 overflow-x-auto px-5 pb-4 sm:-mx-8 sm:px-8 lg:-mx-16 lg:px-16 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {[...clips, ...clips].map((clip, index) => (
            <motion.div
              key={`${clip.src}-${index}`}
              initial={{ opacity: 0, y: 24 }}
              onPointerEnter={(e) => {
                if (e.pointerType === "mouse") setHoveredIndex(index);
              }}
              animate={{
                opacity: activeIndex === null ? 1 : activeIndex === index ? 1 : 0.45,
                y: 0,
                scale: activeIndex === index ? 1.045 : activeIndex === null ? 1 : 0.97,
              }}
              transition={{ duration: 0.5, delay: index < clips.length ? Math.min(index * 0.07, 0.28) : 0, ease: [0.22, 0.76, 0.2, 1] }}
              className={`group relative shrink-0 overflow-hidden rounded-[18px] bg-[#111] ${
                clip.orientation === "portrait" ? "aspect-[9/16] w-[62vw] sm:w-[300px]" : "aspect-[16/9] w-[86vw] sm:w-[560px]"
              }`}
            >
              <AutoplayVideo src={clip.src} poster={clip.poster} className="h-full w-full object-cover" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
