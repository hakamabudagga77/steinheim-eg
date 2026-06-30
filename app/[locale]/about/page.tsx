import Image from "next/image";
import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import ScrollReveal, { StaggerContainer, StaggerItem } from "@/components/ui/ScrollReveal";
import PageTransition from "@/components/layout/PageTransition";
import { Link } from "@/i18n/navigation";

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AboutPageContent />;
}

function AboutPageContent() {
  const t = useTranslations("about");
  const tb = useTranslations("brandPillars");
  const tw = useTranslations("warranty");
  const components = ["sedal", "neoperl", "pvd"] as const;
  const warrantyRows = [
    { term: tw("lifetime"), coverage: tw("sedalCartridges") },
    { term: tw("tenYear"), coverage: tw("chromeNickelFinishes") },
    { term: tw("fiveYear"), coverage: tw("neoperlAerators") },
    { term: tw("threeYear"), coverage: tw("pvdFinishes") },
  ];

  return (
    <PageTransition>
      <div className="bg-[#f3f1ed] text-[#111]">
        {/* Hero — Gessi editorial: huge italic serif on dark bg */}
        <section className="relative flex min-h-[85svh] items-center justify-center overflow-hidden bg-black pt-20 text-white">
          <Image
            src="/images/steinheim/final/about-hero.jpg"
            alt="Steinheim gold rain shower in a sunlit botanical bathroom"
            fill
            priority
            quality={95}
            className="object-cover object-[center_45%] opacity-40"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-black/20" />
          <div className="relative z-10 mx-auto w-full max-w-[1780px] px-5 text-center sm:px-8 lg:px-16">
            <ScrollReveal>
              <p className="text-[11px] uppercase tracking-[0.55em] text-white/45">Our World</p>
              <h1
                className="mx-auto mt-6 max-w-5xl font-heading text-[clamp(3.5rem,10vw,11rem)] leading-[0.85] tracking-[-0.03em]"
                style={{ fontStyle: "italic" }}
              >
                {t("heroHeadline")}
              </h1>
              <p className="mx-auto mt-8 max-w-xl text-[15px] leading-[1.9] text-white/50">
                German-engineered bathroom fixtures, curated for the Egyptian market. Where precision meets lasting beauty.
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* Brand narrative — Gessi editorial: italic serif + body */}
        <section className="px-5 py-24 sm:px-8 lg:px-16 lg:py-32">
          <div className="mx-auto max-w-[1780px]">
            <div className="grid gap-10 lg:grid-cols-[0.35fr_0.65fr] lg:gap-20">
              <ScrollReveal>
                <p className="text-[12px] uppercase tracking-[0.34em] text-black/40">Our position</p>
                <div className="mt-6 h-px w-16 bg-black/12" />
              </ScrollReveal>
              <ScrollReveal delay={0.1}>
                <p
                  className="max-w-3xl font-heading text-[clamp(2rem,4vw,3.4rem)] leading-[1.15]"
                  style={{ fontStyle: "italic" }}
                >
                  {t("narrative")}
                </p>
                <p className="mt-8 max-w-2xl text-[15px] leading-[1.85] text-black/50">
                  Every fixture we produce passes through a rigorous development process — from material
                  sourcing and precision engineering to surface finishing and quality assurance. The result
                  is a product that performs as beautifully as it looks, for decades.
                </p>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* Video interlude */}
        <section className="px-5 sm:px-8 lg:px-16">
          <div className="mx-auto max-w-[1780px]">
            <div className="relative aspect-[21/9] overflow-hidden rounded-[22px]">
              <video autoPlay muted loop playsInline className="h-full w-full object-cover" poster="/images/steinheim/final/about-hero.jpg">
                <source src="https://steinheim-eg.com/cdn/shop/videos/c/vp/85071c8806704603be22828dee32397c/85071c8806704603be22828dee32397c.HD-1080p-7.2Mbps-77449179.mp4?v=0" type="video/mp4" />
              </video>
              <div className="absolute inset-0 bg-black/30" />
              <div className="absolute inset-0 flex items-center justify-center">
                <p
                  className="text-center font-heading text-[clamp(1.8rem,4.5vw,4rem)] leading-[1.05] text-white tracking-[-0.03em]"
                  style={{ fontStyle: "italic" }}
                >
                  Every detail, engineered.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Story cards */}
        <section className="px-5 py-24 sm:px-8 lg:px-16 lg:py-32">
          <div className="mx-auto max-w-[1780px]">
            <ScrollReveal>
              <p className="text-[12px] uppercase tracking-[0.34em] text-black/40">Our story</p>
              <h2
                className="mt-4 max-w-3xl text-[clamp(2.4rem,5vw,5.6rem)] font-normal leading-[0.92] tracking-[-0.04em]"
                style={{ fontStyle: "italic" }}
              >
                Rooted in precision, shaped for endurance.
              </h2>
            </ScrollReveal>
            <StaggerContainer className="mt-16 grid gap-5 md:grid-cols-3">
              {[
                { label: "Quality Standards", text: "At Steinheim, quality is not treated as a feature, but as a fundamental requirement. Each product is developed through a structured process that prioritises performance, consistency, and long-term reliability across all applications." },
                { label: "German Design", text: "Rooted in the principles of precision, discipline, and functional elegance, Steinheim embodies the essence of German design and engineering. From concept to execution, German technology ensures consistent performance and refined detailing." },
                { label: "Technology", text: "Every product is developed with a focus on clean architectural lines, advanced internal mechanisms, and long-term reliability. That involves the entire process of creation, research, testing, and production with maximum care." },
              ].map((item, i) => (
                <StaggerItem key={item.label}>
                  <article className="h-full rounded-[18px] bg-white p-8 sm:p-10">
                    <p className="text-[11px] text-black/20">0{i + 1}</p>
                    <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.25em] text-black/40">{item.label}</p>
                    <p className="mt-5 text-[15px] leading-[1.85] text-black/55">{item.text}</p>
                  </article>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        {/* Full-bleed lifestyle image */}
        <section className="px-5 sm:px-8 lg:px-16">
          <div className="mx-auto max-w-[1780px]">
            <div className="relative aspect-[21/9] overflow-hidden rounded-[22px]">
              <Image
                src="/images/steinheim/final/about-craft.jpg"
                alt="Steinheim wall-mounted basin mixer in brushed bronze"
                fill
                quality={90}
                className="object-cover"
                sizes="100vw"
              />
            </div>
          </div>
        </section>

        {/* Brand pillars — dark section */}
        <section className="mt-20 px-5 sm:px-8 lg:mt-28 lg:px-16">
          <div className="mx-auto max-w-[1780px]">
            <div className="rounded-[22px] bg-black px-8 py-20 text-white sm:px-12 lg:px-16 lg:py-28">
              <ScrollReveal>
                <p className="text-[11px] uppercase tracking-[0.4em] text-white/35">Inside every specification</p>
                <h2
                  className="mt-4 max-w-3xl text-[clamp(2.2rem,5vw,5rem)] font-normal leading-[0.92] tracking-[-0.04em]"
                  style={{ fontStyle: "italic" }}
                >
                  Performance is part of the design.
                </h2>
              </ScrollReveal>
              <StaggerContainer className="mt-16 grid border-t border-white/10 md:grid-cols-3">
                {components.map((key, index) => (
                  <StaggerItem key={key}>
                    <article className={`py-10 ${index > 0 ? "border-t border-white/6 md:border-l md:border-t-0 md:pl-10" : ""}`}>
                      <p className="text-[11px] text-white/20">0{index + 1}</p>
                      <h3 className="mt-6 font-heading text-[24px]">{tb(`${key}.title`)}</h3>
                      <p className="mt-5 max-w-sm text-[14px] leading-[1.85] text-white/42">{tb(`${key}.description`)}</p>
                    </article>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </div>
          </div>
        </section>

        {/* Video 2 */}
        <section className="mt-20 px-5 sm:px-8 lg:mt-28 lg:px-16">
          <div className="mx-auto max-w-[1780px]">
            <div className="relative aspect-[21/9] overflow-hidden rounded-[22px]">
              <video autoPlay muted loop playsInline className="h-full w-full object-cover">
                <source src="https://steinheim-eg.com/cdn/shop/videos/c/vp/2d4afb58a5b949a39d20cb5b3fd5e5d5/2d4afb58a5b949a39d20cb5b3fd5e5d5.HD-1080p-7.2Mbps-79305891.mp4?v=0" type="video/mp4" />
              </video>
            </div>
          </div>
        </section>

        {/* Warranty */}
        <section className="px-5 py-24 sm:px-8 lg:px-16 lg:py-32">
          <div className="mx-auto max-w-[1780px]">
            <div className="grid gap-12 lg:grid-cols-[0.4fr_0.6fr] lg:gap-20">
              <ScrollReveal>
                <p className="text-[12px] uppercase tracking-[0.34em] text-black/40">Aftercare</p>
                <h2 className="mt-4 text-[clamp(2rem,4.5vw,4rem)] font-normal leading-[0.95] tracking-[-0.04em]">
                  {t("warrantyTitle")}
                </h2>
                <p className="mt-6 max-w-md text-[14px] leading-[1.85] text-black/50">
                  Coverage is product- and finish-specific. Keep proof of purchase and confirm the final warranty terms for the selected model in Egypt.
                </p>
              </ScrollReveal>
              <ScrollReveal delay={0.1}>
                <div className="overflow-hidden rounded-[18px] bg-white">
                  {warrantyRows.map((row, i) => (
                    <div key={row.term} className={`flex items-center justify-between px-7 py-6 ${i > 0 ? "border-t border-black/6" : ""}`}>
                      <span className="text-[15px] font-medium">{row.term}</span>
                      <span className="text-[14px] text-black/50">{row.coverage}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-[11px] text-black/30">{tw("validInEgypt")}</p>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* Partnership CTA */}
        <section className="px-5 pb-24 sm:px-8 lg:px-16 lg:pb-32">
          <div className="mx-auto max-w-[1780px]">
            <div className="relative overflow-hidden rounded-[22px] bg-black py-24 text-white sm:py-32">
              <Image
                src="/images/steinheim/final/about-system.jpg"
                alt=""
                fill
                className="object-cover opacity-15"
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />
              <div className="relative z-10 mx-auto max-w-3xl px-8 text-center">
                <p
                  className="font-heading text-[clamp(2rem,4.5vw,3.8rem)] leading-[1.05] tracking-[-0.03em]"
                  style={{ fontStyle: "italic" }}
                >
                  {t("partnership")}
                </p>
                <div className="mt-10 flex justify-center">
                  <Link
                    href="/contact"
                    className="rounded-full bg-white px-10 py-4 text-[13px] font-medium text-black transition hover:bg-white/85"
                  >
                    Get in touch
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
