"use client";

import { createElement, useState } from "react";
import Script from "next/script";
import { motion } from "framer-motion";
import { Link } from "@/i18n/navigation";

const moments = [
  {
    label: "Inspect",
    title: "A hero piece, not a catalogue thumbnail.",
    body: "The Joy free-standing bath mixer becomes a spatial object customers can rotate, zoom, and understand before they enter the product page.",
  },
  {
    label: "Specify",
    title: "Built for premium villas and suites.",
    body: "Use it as the emotional anchor for master bathrooms, hotel suites, and high-value residential projects where one product sets the room tone.",
  },
  {
    label: "Trade",
    title: "A stronger handoff for project conversations.",
    body: "Designers and developers can move from a visual impression into the Joy collection, the trade board, or the AI concierge without losing context.",
  },
];

export default function JoyProduct3DFeature() {
  const [viewerReady, setViewerReady] = useState(false);
  const [activeMoment, setActiveMoment] = useState(0);
  const active = moments[activeMoment];

  return (
    <section className="relative overflow-hidden bg-white px-4 py-8 text-charcoal sm:px-6 lg:px-10">
      <Script
        src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js"
        type="module"
        strategy="afterInteractive"
        onLoad={() => setViewerReady(true)}
        onReady={() => setViewerReady(true)}
      />

      <div className="mx-auto max-w-[1440px] overflow-hidden border border-charcoal/10 bg-[#0b0b0b] shadow-[0_30px_90px_rgba(0,0,0,0.12)]">
        <div className="grid min-h-[720px] lg:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)]">
          <div className="relative min-h-[560px] overflow-hidden bg-[#070707]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_44%,rgba(255,255,255,0.16),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(0,0,0,0.72))]" />
            <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-7 py-7 text-white/42 sm:px-10">
              <span className="text-[10px] font-semibold uppercase tracking-[0.3em]">
                Joy in 3D
              </span>
              <span className="hidden text-[10px] uppercase tracking-[0.22em] sm:block">
                Rotate · zoom · inspect
              </span>
            </div>

            <div className="absolute inset-0">
              {viewerReady ? (
                createElement("model-viewer", {
                  src: "/models/products/joy-free-standing-bath-mixer.glb",
                  "camera-controls": true,
                  "auto-rotate": true,
                  "rotation-per-second": "10deg",
                  "shadow-intensity": "0.92",
                  "shadow-softness": "0.82",
                  exposure: "0.92",
                  "environment-image": "neutral",
                  "camera-orbit": "-32deg 66deg auto",
                  "field-of-view": "26deg",
                  "interaction-prompt": "none",
                  className: "h-full w-full",
                })
              ) : (
                <div className="flex h-full items-center justify-center px-10 text-center">
                  <div>
                    <div className="mx-auto h-12 w-12 animate-pulse rounded-full border border-white/20" />
                    <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.26em] text-white/45">
                      Loading 3D product
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black via-black/48 to-transparent" />
            <div className="absolute bottom-7 left-7 right-7 z-10 sm:left-10 sm:right-10">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/35">
                3D prototype asset
              </p>
              <h3 className="mt-2 max-w-xl font-heading text-[clamp(2.6rem,5vw,5.6rem)] leading-[0.92] tracking-[-0.04em] text-white">
                Joy free-standing bath mixer.
              </h3>
            </div>
          </div>

          <div className="relative flex flex-col justify-between bg-[#f7f5f0] px-7 py-10 sm:px-10 lg:px-14 lg:py-16">
            <div>
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55 }}
                className="text-[10px] font-semibold uppercase tracking-[0.34em] text-charcoal/35"
              >
                Interactive specification
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.05, ease: [0.22, 0.76, 0.2, 1] }}
                className="mt-7 max-w-[560px] font-heading text-[clamp(3rem,6vw,6.2rem)] leading-[0.9] tracking-[-0.04em]"
              >
                Make the product feel physical.
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.12 }}
                className="mt-7 max-w-[500px] text-[15px] leading-[1.9] text-charcoal/56"
              >
                This is the first public 3D Steinheim moment: lightweight enough for the homepage,
                focused enough to feel premium, and connected directly to the products customers can specify.
              </motion.p>

              <div className="mt-10 grid grid-cols-3 gap-2">
                {moments.map((moment, index) => {
                  const isActive = index === activeMoment;
                  return (
                    <button
                      key={moment.label}
                      type="button"
                      onClick={() => setActiveMoment(index)}
                      className={`border px-4 py-4 text-left transition-colors ${
                        isActive
                          ? "border-charcoal bg-charcoal text-white"
                          : "border-charcoal/10 bg-white text-charcoal/52 hover:border-charcoal/35 hover:text-charcoal"
                      }`}
                    >
                      <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">
                        {moment.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <motion.div
                key={active.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="mt-9 border-t border-charcoal/10 pt-8"
              >
                <h3 className="font-heading text-4xl leading-none tracking-[-0.02em]">
                  {active.title}
                </h3>
                <p className="mt-5 max-w-[520px] text-[14px] leading-[1.85] text-charcoal/58">
                  {active.body}
                </p>
              </motion.div>
            </div>

            <div className="mt-12">
              <div className="grid gap-3 text-[12px] leading-[1.65] text-charcoal/55 sm:grid-cols-2">
                <div className="border border-charcoal/10 bg-white p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-charcoal/35">
                    Product
                  </p>
                  <p className="mt-2">STM-60-M620 · Joy free-standing bath mixer</p>
                </div>
                <div className="border border-charcoal/10 bg-white p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-charcoal/35">
                    Catalogue note
                  </p>
                  <p className="mt-2">3D is for visual exploration. Exact specs remain catalogue-backed.</p>
                </div>
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/products/joy-free-standing-bath-mixer"
                  className="inline-flex items-center justify-center bg-charcoal px-7 py-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:bg-black"
                >
                  View product
                </Link>
                <Link
                  href="/trade#smart-room-calculator"
                  className="inline-flex items-center justify-center border border-charcoal/20 bg-white px-7 py-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-charcoal transition-colors hover:border-charcoal"
                >
                  Build project
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
