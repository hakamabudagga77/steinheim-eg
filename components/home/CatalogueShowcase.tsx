"use client";

import { createElement, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Script from "next/script";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

const CatalogueFlipbookModal = dynamic(
  () => import("@/components/catalogue/CatalogueFlipbookModal"),
  { ssr: false }
);

const MODEL_SRC = "/models/catalogue-2026.glb";

function ModelViewer({ ready }: { ready: boolean }) {
  if (!ready) return null;

  return createElement("model-viewer", {
    src: MODEL_SRC,
    "camera-controls": true,
    "disable-zoom": true,
    "auto-rotate": true,
    "rotation-per-second": "10deg",
    "shadow-intensity": "1",
    "shadow-softness": "0.8",
    exposure: "0.5",
    "environment-image": "neutral",
    "camera-orbit": "-32deg 52deg auto",
    // Keep the camera above the catalogue's horizon (90deg) so it's never
    // possible to orbit under it and see the underside - the flattest legal
    // view is looking at it edge-on, never from below.
    "min-camera-orbit": "-Infinity 25deg auto",
    "max-camera-orbit": "Infinity 90deg auto",
    "field-of-view": "32deg",
    "interaction-prompt": "none",
    className: "h-full w-full",
  });
}

export default function CatalogueShowcase() {
  const t = useTranslations("catalogue3d");
  const sectionRef = useRef<HTMLElement>(null);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [opening, setOpening] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [originPoint, setOriginPoint] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || shouldLoad) return;

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
      { rootMargin: "100px" }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, [shouldLoad]);

  // The black overlay irises open from wherever the user actually clicked,
  // so the transition reads as "diving into" that exact point rather than a
  // generic fade - hence tracking clientX/clientY through to here.
  function handleOpen(x: number, y: number) {
    setOriginPoint({ x, y });
    setOpening(true);
    window.setTimeout(() => setModalOpen(true), 420);
  }

  // The model area itself stays draggable (model-viewer's own camera-controls
  // rotate it), so a plain onClick would also fire after every drag-to-rotate
  // gesture. Only treat it as "open" when pointerup lands within a few px of
  // pointerdown - i.e. an actual tap/click, not a rotate.
  function handleModelPointerDown(event: React.PointerEvent) {
    pointerStart.current = { x: event.clientX, y: event.clientY };
  }

  function handleModelPointerUp(event: React.PointerEvent) {
    const start = pointerStart.current;
    pointerStart.current = null;
    if (!start) return;
    const distance = Math.hypot(event.clientX - start.x, event.clientY - start.y);
    if (distance < 6) handleOpen(event.clientX, event.clientY);
  }

  function handleClose() {
    setModalOpen(false);
    setOpening(false);
  }

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-black py-24 text-white sm:py-32">
      <div className="mx-auto max-w-[1780px] px-5 sm:px-8 lg:px-16">
        <div className="grid gap-16 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">
          <div>
            <p className="text-[12px] uppercase tracking-[0.34em] text-white/45">{t("eyebrow")}</p>
            <h2 className="mt-4 max-w-xl font-heading text-[clamp(2.6rem,5.5vw,5.4rem)] font-normal leading-[0.95] tracking-[-0.05em]">
              {t("headline")}
            </h2>
            <p className="mt-5 max-w-md text-[15px] leading-[1.75] text-white/60">{t("body")}</p>
          </div>

          <div className="relative aspect-[6/5] w-full">
            {shouldLoad && (
              <>
                <Script
                  src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js"
                  type="module"
                  strategy="afterInteractive"
                  onLoad={() => setScriptReady(true)}
                  onReady={() => setScriptReady(true)}
                />
                <motion.div
                  className="absolute inset-0"
                  onPointerDown={handleModelPointerDown}
                  onPointerUp={handleModelPointerUp}
                  animate={{
                    scale: opening || modalOpen ? 1.15 : 1,
                    filter: opening || modalOpen ? "blur(10px)" : "blur(0px)",
                  }}
                  transition={{ duration: 0.5, ease: [0.65, 0, 0.35, 1] }}
                >
                  <ModelViewer ready={scriptReady} />
                </motion.div>
              </>
            )}

            {/* Static, below the model on mobile — the book fills too much of the
                box at narrow widths for an overlaid button to sit cleanly. From
                sm: up there's enough clearance to overlay it at the bottom again. */}
            <div className="pointer-events-none flex items-center justify-center px-6 pt-8 sm:absolute sm:inset-x-0 sm:bottom-0 sm:pt-0 sm:py-8">
              <button
                type="button"
                onClick={(event) => handleOpen(event.clientX, event.clientY)}
                aria-label={t("openHint")}
                className="pointer-events-auto inline-flex h-[50px] items-center px-9 text-[10px] font-medium uppercase tracking-[0.15em] text-charcoal bg-white transition hover:bg-white/90"
              >
                {t("openCta")}
              </button>
            </div>
          </div>
        </div>
      </div>

      <motion.div
        aria-hidden="true"
        initial={false}
        animate={{
          clipPath: opening || modalOpen
            ? `circle(150% at ${originPoint.x}px ${originPoint.y}px)`
            : `circle(0% at ${originPoint.x}px ${originPoint.y}px)`,
        }}
        transition={{ duration: 0.65, ease: [0.65, 0, 0.35, 1] }}
        className={`fixed inset-0 z-[70] bg-black ${opening || modalOpen ? "" : "pointer-events-none"}`}
      />

      {modalOpen && <CatalogueFlipbookModal open={modalOpen} onClose={handleClose} />}
    </section>
  );
}
