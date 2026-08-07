"use client";

import { useEffect, useRef } from "react";

export interface GlobeMarker {
  /** [latitude, longitude] in degrees. */
  location: [number, number];
  /** Relative size, roughly 0.03-0.15 -- see markerSize() in RealtimePulse.tsx. */
  size: number;
}

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

// Evenly distributes `count` points across a unit sphere -- this is the
// dot-map texture, drawn ourselves in Canvas 2D instead of depending on
// cobe/WebGL (see LiveGlobe history: the WebGL dot-map layer silently
// failed to paint in this project's preview browser while everything else
// about that render path worked, and a from-scratch canvas globe sidesteps
// the mystery entirely rather than depending on a black-box shader/texture
// pipeline actually painting).
function fibonacciSphere(count: number): Vec3[] {
  const points: Vec3[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = goldenAngle * i;
    points.push({ x: Math.cos(theta) * radiusAtY, y, z: Math.sin(theta) * radiusAtY });
  }
  return points;
}

function latLngToVec3([lat, lng]: [number, number]): Vec3 {
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;
  return {
    x: Math.cos(latRad) * Math.sin(lngRad),
    y: Math.sin(latRad),
    z: Math.cos(latRad) * Math.cos(lngRad),
  };
}

// Rotate around the vertical (Y) axis for auto-spin, then tilt around X for
// a nicer three-quarter viewing angle -- standard orthographic globe setup.
function project(p: Vec3, phi: number, tilt: number): Vec3 {
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);
  const x = p.x * cosPhi + p.z * sinPhi;
  const zRot = -p.x * sinPhi + p.z * cosPhi;
  const cosT = Math.cos(tilt);
  const sinT = Math.sin(tilt);
  return { x, y: p.y * cosT - zRot * sinT, z: p.y * sinT + zRot * cosT };
}

const BASE_POINTS = fibonacciSphere(650);
const TILT = 0.42;

export default function LiveGlobe({ markers }: { markers: GlobeMarker[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phiRef = useRef(4.9); // starting angle roughly centered on Europe/Africa/Middle East
  const markersRef = useRef<GlobeMarker[]>(markers);

  useEffect(() => {
    markersRef.current = markers;
  }, [markers]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let size = canvas.offsetWidth;

    function resize() {
      if (!canvas) return;
      size = canvas.offsetWidth;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
    }
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    function draw() {
      if (!canvas || !ctx) return;
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const r = w * 0.47;

      phiRef.current += 0.0025;
      const phi = phiRef.current;

      ctx.clearRect(0, 0, w, h);

      // Sphere shading -- a soft lit-from-upper-left gradient gives the dot
      // field an actual sense of volume instead of reading as flat confetti.
      const shade = ctx.createRadialGradient(cx - r * 0.32, cy - r * 0.36, r * 0.08, cx, cy, r);
      shade.addColorStop(0, "rgba(76,96,128,0.4)");
      shade.addColorStop(0.55, "rgba(28,30,38,0.55)");
      shade.addColorStop(1, "rgba(8,8,11,0.8)");
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = shade;
      ctx.fill();

      for (const p of BASE_POINTS) {
        const proj = project(p, phi, TILT);
        if (proj.z <= 0.02) continue; // back-facing half of the sphere -- hidden
        const sx = cx + proj.x * r;
        const sy = cy - proj.y * r;
        const depth = (proj.z + 1) / 2;
        ctx.beginPath();
        ctx.arc(sx, sy, (0.65 + depth * 1) * dpr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(205,214,228,${(0.12 + depth * 0.32).toFixed(3)})`;
        ctx.fill();
      }

      for (const m of markersRef.current) {
        const proj = project(latLngToVec3(m.location), phi, TILT);
        if (proj.z <= -0.04) continue; // hide once it's rotated well past the limb
        const sx = cx + proj.x * r;
        const sy = cy - proj.y * r;
        const depth = Math.max(0.35, (proj.z + 1) / 2);
        const markerSize = (3.2 + m.size * 14) * dpr * depth;
        ctx.save();
        ctx.shadowColor = "rgba(10,132,255,0.85)";
        ctx.shadowBlur = 9 * dpr;
        ctx.beginPath();
        ctx.arc(sx, sy, markerSize, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(56,150,255,0.95)";
        ctx.fill();
        ctx.restore();
      }

      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.lineWidth = 1.25 * dpr;
      ctx.strokeStyle = "rgba(130,155,190,0.22)";
      ctx.stroke();

      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="mx-auto aspect-square w-full max-w-[280px]">
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
