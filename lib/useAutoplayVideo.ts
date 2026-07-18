import { useEffect, type RefObject } from "react";

export function useAutoplayVideo(ref: RefObject<HTMLVideoElement | null>, src: string) {
  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    video.muted = true;
    video.playsInline = true;

    let inView = true;

    const tryPlay = () => {
      // Respect an explicit user pause (set via video.dataset.userPaused).
      if (!inView || video.dataset.userPaused === "1") return;
      video.play().catch(() => {
        const resume = () => {
          if (inView && video.dataset.userPaused !== "1") video.play().catch(() => {});
          window.removeEventListener("touchstart", resume);
          window.removeEventListener("click", resume);
        };
        window.addEventListener("touchstart", resume, { once: true });
        window.addEventListener("click", resume, { once: true });
      });
    };

    if (video.readyState >= 2) {
      tryPlay();
    } else {
      video.addEventListener("loadeddata", tryPlay, { once: true });
    }

    const onVisibility = () => {
      if (document.visibilityState === "visible") tryPlay();
    };
    document.addEventListener("visibilitychange", onVisibility);

    // Offscreen videos burn CPU/battery decoding frames nobody sees; pause
    // them and resume seamlessly when they scroll back into view.
    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        ([entry]) => {
          inView = entry.isIntersecting;
          if (inView) {
            tryPlay();
          } else if (!video.paused) {
            video.pause();
          }
        },
        { rootMargin: "160px" }
      );
      observer.observe(video);
    }

    return () => {
      video.removeEventListener("loadeddata", tryPlay);
      document.removeEventListener("visibilitychange", onVisibility);
      observer?.disconnect();
    };
  }, [ref, src]);
}
