"use client";

import { useEffect, useRef } from "react";
import createGlobe, { type COBEOptions, type Marker } from "cobe";

// cobe's shipped .d.ts omits `onRender`, even though the runtime requires it
// for any rotation/marker updates (see README) -- extending the type locally
// rather than reaching for `as any` on the whole options object.
type GlobeOptions = COBEOptions & { onRender: (state: Record<string, unknown>) => void };

/**
 * Realtime visitor globe. Markers are pushed in via a ref and re-applied
 * every animation frame inside onRender -- this is the standard cobe
 * pattern for a globe whose data updates over time (our 30s realtime poll)
 * without tearing down and recreating the WebGL context on every refresh,
 * which would flash/reset the rotation.
 */
export default function LiveGlobe({ markers }: { markers: Marker[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phiRef = useRef(4.9); // starting angle roughly centered on Europe/Africa/Middle East
  const markersRef = useRef<Marker[]>(markers);

  // Keep the ref current without writing to it during render (see
  // react-hooks/refs) -- onRender below reads markersRef every frame, so
  // this is what makes a fresh realtime poll actually reach the globe.
  useEffect(() => {
    markersRef.current = markers;
  }, [markers]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let width = canvas.offsetWidth;
    const onResize = () => {
      if (canvas) width = canvas.offsetWidth;
    };
    window.addEventListener("resize", onResize);

    const options: GlobeOptions = {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi: phiRef.current,
      theta: 0.32,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 14000,
      // A dark theme still needs real contrast between the dot-map and the
      // panel background, or the sphere itself disappears and only the
      // markers are visible -- this brightness/base pairing keeps the globe
      // legibly grey against the panel's near-black without going stark.
      mapBrightness: 7,
      // With dark:1, cobe's dot brightness comes from sampling its built-in
      // world-map texture, which loads async and is 0 (invisible) until it
      // resolves. mapBaseBrightness sets a brightness floor that doesn't
      // depend on that texture, so the sphere itself is never invisible in
      // environments where texture decode is slow or unavailable -- it
      // still lets the map brighten further over landmasses once loaded.
      mapBaseBrightness: 0.45,
      baseColor: [0.42, 0.42, 0.48],
      markerColor: [10 / 255, 132 / 255, 1],
      glowColor: [0.25, 0.45, 0.7],
      markers: markersRef.current,
      onRender: (state) => {
        // Slow, continuous auto-rotation; state.markers is re-read from the
        // ref every frame so a fresh realtime poll updates the globe in
        // place instead of needing globe.update() + a visible reset.
        phiRef.current += 0.0025;
        state.phi = phiRef.current;
        state.width = width * 2;
        state.height = width * 2;
        state.markers = markersRef.current;
      },
    };
    const globe = createGlobe(canvas, options);

    return () => {
      globe.destroy();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[280px]">
      {/* Static CSS backdrop, always present behind the canvas -- if WebGL
          is unsupported/disabled/slow on a visitor's browser, this alone
          still reads as "a globe" instead of an empty box. The canvas draws
          on top of it once (if) the real render kicks in. */}
      <div
        className="absolute inset-[6%] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 32% 28%, rgba(120,150,190,0.35), rgba(30,32,40,0.9) 55%, rgba(10,10,13,0.95) 78%)",
          boxShadow: "inset 0 0 40px rgba(0,0,0,0.6), 0 0 40px rgba(10,132,255,0.08)",
        }}
      />
      <canvas ref={canvasRef} className="relative h-full w-full" style={{ contain: "layout paint size" }} />
    </div>
  );
}
