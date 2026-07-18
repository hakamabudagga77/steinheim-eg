"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

type LenisInstance = {
  raf: (time: number) => void;
  destroy: () => void;
  scrollTo: (target: number, options?: { immediate?: boolean }) => void;
};

export default function SmoothScroll() {
  const lenisRef = useRef<LenisInstance | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    // Native scrolling already respects the user's motion preference; layering
    // Lenis on top would fight it and waste a permanent rAF loop.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let rafId: number;
    let cancelled = false;

    (async () => {
      try {
        const Lenis = (await import("lenis")).default;
        if (cancelled) return;
        const lenis = new Lenis({
          duration: 1.2,
          easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          smoothWheel: true,
          anchors: true,
        }) as unknown as LenisInstance;
        lenisRef.current = lenis;

        function raf(time: number) {
          lenis.raf(time);
          rafId = requestAnimationFrame(raf);
        }
        rafId = requestAnimationFrame(raf);
      } catch {
        // Lenis not installed — graceful fallback
      }
    })();

    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
      lenisRef.current?.destroy();
      lenisRef.current = null;
    };
  }, []);

  useEffect(() => {
    lenisRef.current?.scrollTo(0, { immediate: true });
  }, [pathname]);

  return null;
}
