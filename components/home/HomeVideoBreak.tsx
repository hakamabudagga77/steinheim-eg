"use client";

import ScrollReveal from "@/components/ui/ScrollReveal";

export default function HomeVideoBreak() {
  return (
    <section className="bg-charcoal">
      <div className="relative aspect-[21/9] w-full overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="h-full w-full object-cover"
          poster="/images/steinheim/final/about-hero.jpg"
        >
          <source
            src="https://steinheim-eg.com/cdn/shop/videos/c/vp/85071c8806704603be22828dee32397c/85071c8806704603be22828dee32397c.HD-1080p-7.2Mbps-77449179.mp4?v=0"
            type="video/mp4"
          />
        </video>
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 flex items-center justify-center">
          <ScrollReveal>
            <p className="text-center font-heading text-[clamp(1.6rem,4vw,3.5rem)] leading-[1.1] text-white">
              Every detail, engineered.
            </p>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
