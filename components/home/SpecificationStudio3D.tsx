"use client";

import { createElement, useState } from "react";
import Script from "next/script";
import { motion } from "framer-motion";
import { Link } from "@/i18n/navigation";

const studioModes = [
  "Home renovation",
  "Interior design",
  "Hotel suite",
  "Developer schedule",
];

export default function SpecificationStudio3D() {
  const [viewerReady, setViewerReady] = useState(false);

  return (
    <section className="relative overflow-hidden bg-[#f4f1ec] px-4 py-8 text-charcoal sm:px-6 lg:px-10">
      <Script
        src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js"
        type="module"
        strategy="afterInteractive"
        onLoad={() => setViewerReady(true)}
        onReady={() => setViewerReady(true)}
      />

      <div className="mx-auto max-w-[1440px] overflow-hidden border border-charcoal/10 bg-[#111] shadow-[0_30px_90px_rgba(0,0,0,0.14)]">
        <div className="grid min-h-[760px] lg:grid-cols-[minmax(420px,0.82fr)_minmax(0,1.18fr)]">
          <div className="relative z-10 flex flex-col justify-between bg-white px-7 py-10 sm:px-10 lg:px-14 lg:py-16">
            <div>
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55 }}
                className="text-[10px] font-semibold uppercase tracking-[0.34em] text-charcoal/35"
              >
                3D specification studio
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.05, ease: [0.22, 0.76, 0.2, 1] }}
                className="mt-7 max-w-[560px] font-heading text-[clamp(3rem,6vw,6.6rem)] leading-[0.9] tracking-[-0.04em]"
              >
                Specify the room, not just the mixer.
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.12 }}
                className="mt-7 max-w-[500px] text-[15px] leading-[1.9] text-charcoal/56"
              >
                Steinheim is sold as a coordinated bathroom system. This studio gives
                homeowners, designers, and trade teams a spatial way to think about
                basin, shower, finish, and project intent before building a schedule.
              </motion.p>

              <div className="mt-10 grid grid-cols-2 gap-2">
                {studioModes.map((mode, index) => (
                  <motion.div
                    key={mode}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: 0.18 + index * 0.05 }}
                    className="border border-charcoal/10 bg-[#faf9f6] px-4 py-4"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-charcoal/48">
                      {mode}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="mt-12 border-t border-charcoal/10 pt-8">
              <p className="max-w-[500px] text-[12px] leading-[1.75] text-charcoal/42">
                3D scene is a specification study, not exact product CAD. Final product
                models, finishes, stock, and trade pricing are confirmed through the
                active Steinheim Egypt catalogue workflow.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/trade#smart-room-calculator"
                  className="inline-flex items-center justify-center bg-charcoal px-7 py-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:bg-black"
                >
                  Build schedule
                </Link>
                <Link
                  href="/assistant"
                  className="inline-flex items-center justify-center border border-charcoal/20 px-7 py-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-charcoal transition-colors hover:border-charcoal"
                >
                  Ask concierge
                </Link>
              </div>
            </div>
          </div>

          <div className="relative min-h-[560px] overflow-hidden bg-[#090909]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_52%_42%,rgba(255,255,255,0.16),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(0,0,0,0.68))]" />
            <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-7 py-7 text-white/42 sm:px-10">
              <span className="text-[10px] font-semibold uppercase tracking-[0.28em]">
                Spatial preview
              </span>
              <span className="hidden text-[10px] uppercase tracking-[0.22em] sm:block">
                Rotate · zoom · inspect
              </span>
            </div>

            <div className="absolute inset-0">
              {viewerReady ? (
                <div className="h-full w-full">
                  {createElement("model-viewer", {
                    src: "/models/steinheim-spec-studio.glb",
                    "camera-controls": true,
                    "auto-rotate": true,
                    "rotation-per-second": "12deg",
                    "shadow-intensity": "0.85",
                    "shadow-softness": "0.85",
                    exposure: "0.82",
                    "environment-image": "neutral",
                    "camera-orbit": "-34deg 66deg 5.1m",
                    "min-camera-orbit": "auto 42deg 3.7m",
                    "max-camera-orbit": "auto 82deg 7m",
                    "field-of-view": "30deg",
                    "interaction-prompt": "none",
                    className: "h-full w-full",
                  })}
                </div>
              ) : (
                <div className="flex h-full items-center justify-center px-10 text-center">
                  <div>
                    <div className="mx-auto h-12 w-12 animate-pulse rounded-full border border-white/20" />
                    <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.26em] text-white/45">
                      Loading 3D studio
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black via-black/45 to-transparent" />
            <div className="absolute bottom-7 left-7 right-7 z-10 flex flex-col gap-3 text-white sm:left-10 sm:right-10 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/35">
                  Concept
                </p>
                <h3 className="mt-2 font-heading text-4xl leading-none tracking-[-0.03em]">
                  One room. Many decisions.
                </h3>
              </div>
              <p className="max-w-[330px] text-[12px] leading-[1.7] text-white/45">
                A visual layer for specification, finish discussion, and trade handoff.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
