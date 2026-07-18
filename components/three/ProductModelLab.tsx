"use client";

import { createElement, useState } from "react";
import Script from "next/script";

const concepts = [
  {
    id: "hero",
    label: "Hero object",
    title: "One iconic product.",
    body: "A focused luxury moment using the lightest and cleanest model. Best candidate for homepage without hurting speed.",
  },
  {
    id: "selector",
    label: "Product selector",
    title: "A 3D catalogue rail.",
    body: "Customers switch between real Steinheim product families and inspect each one before going to the product page.",
  },
  {
    id: "studio",
    label: "Room studio",
    title: "A specification room.",
    body: "A full bathroom scene for visualizing project intent. Good for trade storytelling, but heavier and less product-accurate.",
  },
  {
    id: "finish",
    label: "Finish theatre",
    title: "A material-led experience.",
    body: "A dramatic finish/material story using 3D as atmosphere, while the catalogue stays grounded in real product data.",
  },
] as const;

const models = [
  {
    name: "Joy Basin Mixer",
    slug: "joy-basin-mixer",
    file: "/models/products/joy-basin-mixer.glb",
    scale: "19 cm Meshy export",
    origin: "Bottom",
    note: "Check if the spout/body silhouette is clean enough for product composition.",
  },
  {
    name: "Joy Wall-Mounted Basin Mixer",
    slug: "joy-wall-mounted-basin-mixer",
    file: "/models/products/joy-wall-mounted-basin-mixer.glb",
    scale: "10 cm Meshy export",
    origin: "Center",
    note: "This should read as wall-mounted: spout + control/plate, not a deck mixer.",
  },
  {
    name: "Joy Concealed Shower",
    slug: "joy-concealed-shower",
    file: "/models/products/joy-concealed-shower.glb",
    scale: "120 cm Meshy export",
    origin: "Center",
    note: "Look for the rain head, shower arm, hand shower, and mixer plate as a set.",
  },
  {
    name: "Joy Shower Column",
    slug: "joy-shower-column",
    file: "/models/products/joy-shower-column.glb",
    scale: "120 cm Meshy export",
    origin: "Bottom",
    note: "This should stand cleanly as a full shower column.",
  },
  {
    name: "Joy Free-Standing Bath Mixer",
    slug: "joy-free-standing-bath-mixer",
    file: "/models/products/joy-free-standing-bath-mixer.glb",
    scale: "114.5 cm Meshy export",
    origin: "Bottom",
    note: "This one is light enough for web and could become the hero 3D product.",
  },
];

const heroModel = models.find((model) => model.slug === "joy-free-standing-bath-mixer") ?? models[0];

function ModelViewer({
  file,
  ready,
  cameraOrbit = "-32deg 66deg auto",
  fieldOfView = "28deg",
}: {
  file: string;
  ready: boolean;
  cameraOrbit?: string;
  fieldOfView?: string;
}) {
  if (!ready) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/35">
          Loading model viewer
        </p>
      </div>
    );
  }

  return createElement("model-viewer", {
    key: file,
    src: file,
    "camera-controls": true,
    "auto-rotate": true,
    "rotation-per-second": "10deg",
    "shadow-intensity": "0.9",
    "shadow-softness": "0.8",
    exposure: "0.86",
    "environment-image": "neutral",
    "camera-orbit": cameraOrbit,
    "field-of-view": fieldOfView,
    "interaction-prompt": "none",
    className: "h-full w-full",
  });
}

export default function ProductModelLab() {
  const [viewerReady, setViewerReady] = useState(false);
  const [activeConcept, setActiveConcept] = useState<(typeof concepts)[number]["id"]>("selector");
  const [activeSlug, setActiveSlug] = useState(models[0].slug);
  const active = models.find((model) => model.slug === activeSlug) ?? models[0];
  const concept = concepts.find((entry) => entry.id === activeConcept) ?? concepts[0];

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-5 py-28 text-white sm:px-8 lg:px-12">
      <Script
        src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js"
        type="module"
        strategy="afterInteractive"
        onLoad={() => setViewerReady(true)}
        onReady={() => setViewerReady(true)}
      />

      <div className="mx-auto max-w-[1440px]">
        <div className="max-w-4xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-white/35">
            Steinheim 3D experiment room
          </p>
          <h1 className="mt-6 font-heading text-[clamp(3rem,7vw,7rem)] leading-[0.9] tracking-[-0.04em]">
            3D concept lab.
          </h1>
          <p className="mt-7 max-w-2xl text-[15px] leading-[1.9] text-white/48">
            Test different 3D ideas here before anything goes public. This is where we separate
            premium Steinheim moments from random 3D noise.
          </p>
        </div>

        <div className="mt-10 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {concepts.map((entry) => {
            const isActive = entry.id === activeConcept;
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => setActiveConcept(entry.id)}
                className={`border px-5 py-5 text-left transition-colors ${
                  isActive
                    ? "border-white bg-white text-charcoal"
                    : "border-white/10 bg-white/[0.03] text-white hover:border-white/35"
                }`}
              >
                <span className="block text-[10px] font-semibold uppercase tracking-[0.22em]">
                  {entry.label}
                </span>
                <span className={`mt-3 block font-heading text-2xl leading-none ${isActive ? "text-charcoal" : "text-white/82"}`}>
                  {entry.title}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 border border-white/10 bg-white/[0.03] p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-white/35">
            Active concept
          </p>
          <p className="mt-2 max-w-3xl text-[14px] leading-[1.8] text-white/58">
            <span className="font-semibold text-white">{concept.title}</span> {concept.body}
          </p>
        </div>

        {activeConcept === "selector" ? (
          <div className="mt-12 grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="space-y-2">
            {models.map((model) => {
              const isActive = model.slug === activeSlug;
              return (
                <button
                  key={model.slug}
                  type="button"
                  onClick={() => setActiveSlug(model.slug)}
                  className={`w-full border px-5 py-4 text-left transition-colors ${
                    isActive
                      ? "border-white bg-white text-charcoal"
                      : "border-white/10 bg-white/[0.03] text-white hover:border-white/35"
                  }`}
                >
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.18em]">
                    {model.name}
                  </span>
                  <span className={`mt-2 block text-[11px] ${isActive ? "text-charcoal/55" : "text-white/38"}`}>
                    {model.scale} · Origin: {model.origin}
                  </span>
                </button>
              );
            })}
          </div>

          <section className="overflow-hidden border border-white/10 bg-[#0a0a0a]">
            <div className="grid min-h-[680px] lg:grid-cols-[minmax(0,1fr)_360px]">
              <div className="relative min-h-[520px] bg-[radial-gradient(circle_at_50%_45%,rgba(255,255,255,0.13),transparent_34%),linear-gradient(180deg,#181818,#050505)]">
                <ModelViewer ready={viewerReady} file={active.file} />
              </div>

              <aside className="border-t border-white/10 bg-white px-7 py-8 text-charcoal lg:border-l lg:border-t-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-charcoal/35">
                  Active asset
                </p>
                <h2 className="mt-4 font-heading text-4xl leading-none tracking-[-0.02em]">
                  {active.name}
                </h2>
                <dl className="mt-8 space-y-5 text-[13px]">
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-[0.2em] text-charcoal/35">File</dt>
                    <dd className="mt-1 break-all text-charcoal/70">{active.file}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-[0.2em] text-charcoal/35">Scale</dt>
                    <dd className="mt-1 text-charcoal/70">{active.scale}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-[0.2em] text-charcoal/35">Origin</dt>
                    <dd className="mt-1 text-charcoal/70">{active.origin}</dd>
                  </div>
                </dl>
                <p className="mt-8 border-t border-charcoal/10 pt-6 text-[13px] leading-[1.7] text-charcoal/58">
                  {active.note}
                </p>
                <p className="mt-8 text-[11px] leading-[1.65] text-charcoal/38">
                  If a model looks inaccurate, do not use it in product pages. We can still use strong assets as
                  atmospheric 3D elements or regenerate the weak ones with cleaner reference images.
                </p>
              </aside>
            </div>
          </section>
        </div>
        ) : null}

        {activeConcept === "hero" ? (
          <section className="mt-12 overflow-hidden border border-white/10 bg-[#0a0a0a]">
            <div className="grid min-h-[720px] lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
              <div className="relative min-h-[560px] bg-[radial-gradient(circle_at_50%_44%,rgba(255,255,255,0.16),transparent_34%),linear-gradient(180deg,#171717,#050505)]">
                <ModelViewer ready={viewerReady} file={heroModel.file} cameraOrbit="-26deg 64deg auto" fieldOfView="25deg" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black via-black/40 to-transparent" />
                <div className="absolute bottom-8 left-8 right-8">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/35">Homepage candidate</p>
                  <h2 className="mt-3 max-w-2xl font-heading text-[clamp(3rem,6vw,6rem)] leading-[0.9] tracking-[-0.04em]">
                    Joy in 3D.
                  </h2>
                </div>
              </div>
              <div className="bg-white px-8 py-10 text-charcoal sm:px-12 lg:py-16">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-charcoal/35">
                  Why this works
                </p>
                <h3 className="mt-6 font-heading text-5xl leading-none tracking-[-0.03em]">
                  Clean, fast, focused.
                </h3>
                <p className="mt-7 text-[15px] leading-[1.9] text-charcoal/58">
                  The free-standing mixer is the safest public 3D asset because it is the smallest file, the easiest to understand visually, and it feels like a luxury hero object instead of a technical demo.
                </p>
                <div className="mt-9 grid gap-3">
                  {["Use on homepage", "Use on Joy product page", "Connect to project board later"].map((item) => (
                    <div key={item} className="border border-charcoal/10 bg-[#ece9e2] px-5 py-4 text-[12px] font-semibold uppercase tracking-[0.18em] text-charcoal/58">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {activeConcept === "studio" ? (
          <section className="mt-12 overflow-hidden border border-white/10 bg-[#0a0a0a]">
            <div className="grid min-h-[720px] lg:grid-cols-[minmax(0,1fr)_380px]">
              <div className="relative min-h-[560px] bg-[radial-gradient(circle_at_50%_44%,rgba(255,255,255,0.16),transparent_34%),linear-gradient(180deg,#171717,#050505)]">
                <ModelViewer ready={viewerReady} file="/models/steinheim-spec-studio.glb" cameraOrbit="-34deg 66deg 5.1m" fieldOfView="30deg" />
              </div>
              <aside className="bg-white px-8 py-10 text-charcoal lg:py-16">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-charcoal/35">
                  Room studio test
                </p>
                <h3 className="mt-6 font-heading text-5xl leading-none tracking-[-0.03em]">
                  Strong idea, heavy asset.
                </h3>
                <p className="mt-7 text-[15px] leading-[1.9] text-charcoal/58">
                  This scene is more useful for trade storytelling than product accuracy. It should probably become a dedicated 3D studio page, not automatic homepage load.
                </p>
                <div className="mt-9 space-y-3 text-[12px] leading-[1.7] text-charcoal/58">
                  <p><span className="font-semibold text-charcoal">Pros:</span> memorable, spatial, feels custom.</p>
                  <p><span className="font-semibold text-charcoal">Risks:</span> 31MB file, not exact product CAD, can look generic if overused.</p>
                </div>
              </aside>
            </div>
          </section>
        ) : null}

        {activeConcept === "finish" ? (
          <section className="mt-12 overflow-hidden border border-white/10 bg-[#0a0a0a] p-6 sm:p-10">
            <div className="grid gap-4 lg:grid-cols-3">
              {[
                ["Chrome", "Mirror-clean, universal, safest for high-volume bathrooms"],
                ["Brushed Gold", "Warm premium mood for suites and feature bathrooms"],
                ["Matte Black", "Graphic architectural contrast for contemporary spaces"],
              ].map(([name, body], index) => (
                <div
                  key={name}
                  className="relative min-h-[520px] overflow-hidden border border-white/10 bg-[radial-gradient(circle_at_50%_36%,rgba(255,255,255,0.14),transparent_34%),linear-gradient(180deg,#171717,#050505)]"
                >
                  <div className={`absolute left-1/2 top-[38%] h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full blur-xl ${
                    index === 0 ? "bg-white/20" : index === 1 ? "bg-[#c9a96e]/28" : "bg-black/60"
                  }`} />
                  <div className={`absolute left-1/2 top-[38%] h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full border shadow-2xl ${
                    index === 0
                      ? "border-white/50 bg-[linear-gradient(135deg,#f6f6f6,#777,#fff)]"
                      : index === 1
                        ? "border-[#e0c17b]/60 bg-[linear-gradient(135deg,#f2d890,#9a6f24,#ffe4a8)]"
                        : "border-white/12 bg-[linear-gradient(135deg,#393939,#050505,#1c1c1c)]"
                  }`} />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-7">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/35">Finish theatre</p>
                    <h3 className="mt-3 font-heading text-4xl leading-none tracking-[-0.03em]">{name}</h3>
                    <p className="mt-4 text-[13px] leading-[1.7] text-white/45">{body}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-6 max-w-3xl text-[13px] leading-[1.8] text-white/45">
              This concept may not need Meshy product geometry at all. It can be a premium material/finish story using real PVD assets, motion, light, and the catalogue logic.
            </p>
          </section>
        ) : null}
      </div>
    </main>
  );
}
