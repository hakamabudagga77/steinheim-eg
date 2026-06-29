import Image from "next/image";
import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import Container from "@/components/ui/Container";
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
      {/* Hero — cinematic, full viewport */}
      <section className="relative flex min-h-[80svh] items-end overflow-hidden bg-charcoal pt-20 text-white lg:min-h-[85svh]">
        <Image
          src="/images/steinheim/final/about-hero.jpg"
          alt="Steinheim gold rain shower in a sunlit botanical bathroom"
          fill
          priority
          quality={95}
          className="object-cover object-[center_45%] opacity-65"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/30" />
        <Container className="relative z-10 w-full pb-14 sm:pb-20 lg:pb-24">
          <ScrollReveal>
            <p className="text-[9px] font-medium uppercase tracking-[0.3em] text-white/40">
              About Steinheim
            </p>
            <h1 className="mt-5 max-w-3xl font-heading text-[clamp(2.6rem,6.5vw,5.2rem)] leading-[0.95] tracking-[-0.01em]">
              {t("heroHeadline")}
            </h1>
            <p className="mt-6 max-w-lg text-[15px] leading-relaxed text-white/40">
              German-engineered bathroom fixtures, curated for the Egyptian market. Where precision meets lasting beauty.
            </p>
          </ScrollReveal>
        </Container>
      </section>

      {/* Brand narrative — asymmetric editorial layout */}
      <section className="bg-white py-20 sm:py-28 lg:py-36">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[0.3fr_0.7fr] lg:gap-16">
            <ScrollReveal>
              <p className="text-[9px] font-medium uppercase tracking-[0.25em] text-warm-gray">Our position</p>
              <div className="mt-6 h-px w-12 bg-charcoal/15" />
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <p className="max-w-3xl font-heading text-[clamp(1.5rem,2.8vw,2.4rem)] leading-[1.25] text-charcoal">
                {t("narrative")}
              </p>
              <p className="mt-8 max-w-2xl text-[14px] leading-[1.9] text-warm-gray">
                Every fixture we produce passes through a rigorous development process — from material
                sourcing and precision engineering to surface finishing and quality assurance. The result
                is a product that performs as beautifully as it looks, for decades.
              </p>
            </ScrollReveal>
          </div>
        </Container>
      </section>

      {/* Video 1 — cinematic interlude */}
      <section className="bg-charcoal">
        <div className="relative aspect-[21/9] w-full overflow-hidden">
          <video autoPlay muted loop playsInline className="h-full w-full object-cover" poster="/images/steinheim/final/about-hero.jpg">
            <source src="https://steinheim-eg.com/cdn/shop/videos/c/vp/85071c8806704603be22828dee32397c/85071c8806704603be22828dee32397c.HD-1080p-7.2Mbps-77449179.mp4?v=0" type="video/mp4" />
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

      {/* Story — Quality, Design, Technology */}
      <section className="bg-white py-20 sm:py-28 lg:py-36">
        <Container>
          <ScrollReveal>
            <p className="text-[9px] font-medium uppercase tracking-[0.25em] text-warm-gray">Our story</p>
            <h2 className="mt-5 max-w-2xl font-heading text-[clamp(1.8rem,3.5vw,3rem)] leading-[1.05] text-charcoal">
              Rooted in precision,<br />shaped for endurance.
            </h2>
          </ScrollReveal>
          <StaggerContainer className="mt-14 grid gap-4 md:grid-cols-3">
            {[
              {
                label: "Quality Standards",
                text: "At Steinheim, quality is not treated as a feature, but as a fundamental requirement. Each product is developed through a structured process that prioritises performance, consistency, and long-term reliability across all applications.",
              },
              {
                label: "German Design",
                text: "Rooted in the principles of precision, discipline, and functional elegance, Steinheim embodies the essence of German design and engineering. From concept to execution, German technology ensures consistent performance and refined detailing.",
              },
              {
                label: "Technology",
                text: "Every product is developed with a focus on clean architectural lines, advanced internal mechanisms, and long-term reliability. That involves the entire process of creation, research, testing, and production with maximum care.",
              },
            ].map((item, i) => (
              <StaggerItem key={item.label}>
                <article className="h-full border border-charcoal/10 bg-[#FAFAF8] p-6 sm:p-8">
                  <p className="font-mono text-[9px] text-charcoal/20">0{i + 1}</p>
                  <p className="mt-5 text-[10px] font-medium uppercase tracking-[0.2em] text-charcoal">
                    {item.label}
                  </p>
                  <p className="mt-5 text-[14px] leading-[1.85] text-warm-gray">{item.text}</p>
                </article>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </Container>
      </section>

      {/* Lifestyle image break — full bleed */}
      <section className="relative h-[50svh] overflow-hidden sm:h-[60svh]">
        <Image
          src="/images/steinheim/final/about-craft.jpg"
          alt="Steinheim wall-mounted basin mixer in brushed bronze"
          fill
          quality={90}
          className="object-cover"
          sizes="100vw"
        />
      </section>

      {/* Brand pillars — Sedal, Neoperl, PVD */}
      <section className="bg-charcoal py-20 text-white sm:py-28 lg:py-36">
        <Container>
          <ScrollReveal>
            <p className="text-[9px] font-medium uppercase tracking-[0.25em] text-white/35">
              Inside every specification
            </p>
            <h2 className="mt-5 max-w-2xl font-heading text-[clamp(2rem,4.5vw,3.5rem)] leading-[1.02]">
              Performance is part<br className="hidden sm:block" /> of the design.
            </h2>
          </ScrollReveal>
          <StaggerContainer className="mt-16 grid border-t border-white/10 md:grid-cols-3">
            {components.map((key, index) => (
              <StaggerItem key={key}>
                <article className={`py-10 ${index > 0 ? "border-t border-white/8 md:border-l md:border-t-0 md:pl-8" : ""}`}>
                  <p className="font-mono text-[9px] text-white/20">0{index + 1}</p>
                  <h3 className="mt-6 font-heading text-[22px]">{tb(`${key}.title`)}</h3>
                  <p className="mt-5 max-w-sm text-[13px] leading-[1.85] text-white/45">
                    {tb(`${key}.description`)}
                  </p>
                </article>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </Container>
      </section>

      {/* Video 2 */}
      <section className="bg-white">
        <div className="relative aspect-[21/9] w-full overflow-hidden">
          <video autoPlay muted loop playsInline className="h-full w-full object-cover">
            <source src="https://steinheim-eg.com/cdn/shop/videos/c/vp/2d4afb58a5b949a39d20cb5b3fd5e5d5/2d4afb58a5b949a39d20cb5b3fd5e5d5.HD-1080p-7.2Mbps-79305891.mp4?v=0" type="video/mp4" />
          </video>
        </div>
      </section>

      {/* Warranty */}
      <section className="bg-white py-20 sm:py-28 lg:py-36">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.4fr_0.6fr] lg:gap-16">
            <ScrollReveal>
              <p className="text-[9px] font-medium uppercase tracking-[0.25em] text-warm-gray">Aftercare</p>
              <h2 className="mt-5 font-heading text-[clamp(2rem,4vw,3.2rem)] leading-[1.02] text-charcoal">
                {t("warrantyTitle")}
              </h2>
              <p className="mt-6 max-w-md text-[13px] leading-[1.85] text-warm-gray">
                Coverage is product- and finish-specific. Keep proof of purchase and confirm the final
                warranty terms for the selected model in Egypt.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <table className="w-full border-t border-charcoal">
                <tbody>
                  {warrantyRows.map((row) => (
                    <tr key={row.term} className="border-b border-charcoal/8">
                      <td className="w-1/3 py-5 pr-6 text-[13px] font-medium text-charcoal">
                        {row.term}
                      </td>
                      <td className="py-5 text-[13px] text-warm-gray">{row.coverage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-5 text-[10px] leading-5 text-warm-gray/60">{tw("validInEgypt")}</p>
            </ScrollReveal>
          </div>
        </Container>
      </section>

      {/* Partnership closing — elevated with image background */}
      <section className="relative overflow-hidden bg-charcoal py-24 sm:py-32 lg:py-40">
        <Image
          src="/images/steinheim/final/about-system.jpg"
          alt=""
          fill
          className="object-cover opacity-20"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal/60 via-charcoal/40 to-charcoal/80" />
        <Container className="relative z-10">
          <ScrollReveal>
            <p className="mx-auto max-w-3xl text-center font-heading text-[clamp(1.8rem,4vw,3.2rem)] leading-[1.15] text-white">
              {t("partnership")}
            </p>
            <div className="mt-10 flex justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center gap-3 border border-white/25 bg-white/8 px-8 py-3.5 text-[10px] font-medium uppercase tracking-[0.15em] text-white backdrop-blur-sm transition-all duration-300 hover:bg-white hover:text-charcoal"
              >
                Get in touch
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </ScrollReveal>
        </Container>
      </section>
    </PageTransition>
  );
}
