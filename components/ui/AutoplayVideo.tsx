"use client";

import { useEffect, useRef, useState } from "react";
import { useAutoplayVideo } from "@/lib/useAutoplayVideo";

export default function AutoplayVideo({
  src,
  poster,
  className,
}: {
  src: string;
  poster?: string;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  useAutoplayVideo(videoRef, shouldLoad ? src : "");

  useEffect(() => {
    const video = videoRef.current;
    if (!video || shouldLoad) return;

    if (typeof IntersectionObserver === "undefined") {
      const timer = window.setTimeout(() => setShouldLoad(true), 0);
      return () => window.clearTimeout(timer);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShouldLoad(true);
        observer.disconnect();
      },
      { rootMargin: "240px" }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [shouldLoad]);

  return (
    <video
      ref={videoRef}
      muted
      loop
      playsInline
      preload="none"
      poster={poster}
      src={shouldLoad ? src : undefined}
      className={className}
    />
  );
}
