"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useAutoplayVideo } from "@/lib/useAutoplayVideo";

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

function ReelVideo({
  src,
  poster,
  active,
}: {
  src: string;
  poster: string;
  active: boolean;
}) {
  const t = useTranslations("showroom");
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  useAutoplayVideo(videoRef, src);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = muted;
    if (!muted) {
      video.play().catch(() => undefined);
    }
  }, [muted]);

  return (
    <>
      <video
        ref={videoRef}
        autoPlay
        muted={muted}
        loop
        playsInline
        preload="metadata"
        poster={poster}
        className="h-full w-full object-cover"
      >
        <source src={src} type="video/mp4" />
      </video>
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setMuted((value) => !value);
        }}
        aria-label={muted ? t("soundOn") : t("soundOff")}
        className={`absolute bottom-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/35 bg-black/30 text-white backdrop-blur-md transition duration-500 hover:bg-white hover:text-black ${
          active ? "opacity-100" : "opacity-70"
        }`}
      >
        {muted ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 5 6 9H3v6h3l5 4V5Z" />
            <path d="m19 9-4 4" />
            <path d="m15 9 4 4" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 5 6 9H3v6h3l5 4V5Z" />
            <path d="M15.5 8.5a5 5 0 0 1 0 7" />
            <path d="M18.5 5.5a9 9 0 0 1 0 13" />
          </svg>
        )}
      </button>
    </>
  );
}

export default function ShowroomReel() {
  const t = useTranslations("showroom");
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const hoverPausedRef = useRef(false);
  const touchPausedRef = useRef(false);
  const centeredRef = useRef<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [centeredIndex, setCenteredIndex] = useState<number | null>(null);

  const syncPausedState = useCallback(() => {
    pausedRef.current = hoverPausedRef.current || touchPausedRef.current;
  }, []);

  const setHoverPaused = useCallback((paused: boolean) => {
    hoverPausedRef.current = paused;
    syncPausedState();
  }, [syncPausedState]);

  const setTouchPaused = useCallback((paused: boolean) => {
    touchPausedRef.current = paused;
    syncPausedState();
  }, [syncPausedState]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let frame = 0;
    let running = false;
    let lastCenterCheck = 0;
    let lastTimestamp: number | null = null;
    const pixelsPerSecond = 34;

    const step = (timestamp: number) => {
      if (!running) return;
      const delta = lastTimestamp === null ? 16.67 : Math.min(timestamp - lastTimestamp, 80);
      lastTimestamp = timestamp;

      if (!pausedRef.current) {
        const singleSetWidth = track.scrollWidth / 3;
        if (singleSetWidth > 0 && track.scrollLeft < singleSetWidth * 0.5) {
          track.scrollLeft += singleSetWidth;
        }
        const next = track.scrollLeft + (pixelsPerSecond * delta) / 1000;
        track.scrollLeft = next >= singleSetWidth * 2 ? next - singleSetWidth : next;
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
          setCenteredIndex(closest === null ? null : closest % clips.length);
        }
      }

      frame = requestAnimationFrame(step);
    };

    const startLoop = () => {
      if (running) return;
      running = true;
      lastTimestamp = null;
      frame = requestAnimationFrame(step);
    };
    const stopLoop = () => {
      if (!running) return;
      running = false;
      cancelAnimationFrame(frame);
    };

    const releaseTouchPause = () => setTouchPaused(false);
    window.addEventListener("pointerup", releaseTouchPause);
    window.addEventListener("pointercancel", releaseTouchPause);
    window.addEventListener("blur", releaseTouchPause);
    document.addEventListener("visibilitychange", releaseTouchPause);

    track.scrollLeft = track.scrollWidth / 3;

    // The marquee only needs to animate while it is actually on screen.
    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) startLoop();
          else stopLoop();
        },
        { rootMargin: "100px" }
      );
      observer.observe(track);
    } else {
      startLoop();
    }

    return () => {
      stopLoop();
      observer?.disconnect();
      window.removeEventListener("pointerup", releaseTouchPause);
      window.removeEventListener("pointercancel", releaseTouchPause);
      window.removeEventListener("blur", releaseTouchPause);
      document.removeEventListener("visibilitychange", releaseTouchPause);
    };
  }, [setTouchPaused]);

  const activeIndex = hoveredIndex ?? centeredIndex;

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
          <p className="text-[12px] uppercase tracking-[0.34em] text-white/45">{t("eyebrow")}</p>
          <h2 className="mt-4 max-w-2xl font-heading text-[clamp(2.6rem,5.5vw,5.4rem)] font-normal leading-[0.95] tracking-[-0.05em]">
            {t("headline")}
          </h2>
          <p className="mt-5 max-w-md text-[15px] leading-[1.75] text-white/60">
            {t("body")}
          </p>
        </motion.div>
      </div>

      <div className="overflow-hidden">
        <div
          ref={trackRef}
          onPointerEnter={(e) => {
            if (e.pointerType === "mouse") setHoverPaused(true);
          }}
          onPointerLeave={(e) => {
            if (e.pointerType === "mouse") {
              setHoverPaused(false);
              setHoveredIndex(null);
            }
          }}
          onPointerDown={(e) => {
            if (e.pointerType !== "mouse") setTouchPaused(true);
          }}
          onPointerUp={(e) => {
            if (e.pointerType !== "mouse") setTouchPaused(false);
          }}
          onPointerCancel={(e) => {
            if (e.pointerType !== "mouse") setTouchPaused(false);
          }}
          className="flex gap-4 overflow-x-auto px-5 pb-4 sm:px-8 lg:px-16 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
        {[...clips, ...clips, ...clips].map((clip, index) => {
          const clipIndex = index % clips.length;
          const isActive = activeIndex === clipIndex;

          return (
            <motion.div
              key={`${clip.src}-${index}`}
              onPointerEnter={(e) => {
                if (e.pointerType === "mouse") setHoveredIndex(clipIndex);
              }}
              animate={{
                opacity: activeIndex === null ? 1 : isActive ? 1 : 0.45,
                scale: isActive ? 1.045 : activeIndex === null ? 1 : 0.97,
              }}
              transition={{ duration: 0.5, ease: [0.22, 0.76, 0.2, 1] }}
              className={`group relative shrink-0 overflow-hidden rounded-[18px] bg-[#111] ${
                clip.orientation === "portrait" ? "aspect-[9/16] w-[62vw] sm:w-[300px]" : "aspect-[16/9] w-[86vw] sm:w-[560px]"
              }`}
            >
              <ReelVideo src={clip.src} poster={clip.poster} active={isActive} />
            </motion.div>
          );
        })}
        </div>
      </div>
    </section>
  );
}
