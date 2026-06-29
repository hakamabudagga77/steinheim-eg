import Image from "next/image";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Container from "@/components/ui/Container";
import ScrollReveal, { StaggerContainer, StaggerItem } from "@/components/ui/ScrollReveal";
import PageTransition from "@/components/layout/PageTransition";

const projects = [
  {
    id: "the-100-meydan",
    name: "The 100, Meydan",
    location: "Meydan, Dubai",
    country: "UAE",
    category: "Residential development",
    tagline: "A benchmark in refined urban living.",
    description:
      "At The 100 Meydan, Steinheim delivers precision-engineered bathroom systems designed to complement architectural excellence. Every detail reflects a balance of performance, durability, and timeless design — creating spaces that feel both elevated and effortless.",
    image:
      "https://steinheim-eg.com/cdn/shop/files/freepik_regenerate-this-image-hig_2790117748.png?v=1776254023&width=1200",
    scope: ["Basin mixers", "Concealed shower systems", "Bath mixers"],
  },
  {
    id: "one-yard-jvc",
    name: "One Yard JVC Residences",
    location: "Jumeirah Village Circle, Dubai",
    country: "UAE",
    category: "Branded residences",
    partner: "Park Hyatt",
    tagline: "Modern luxury, thoughtfully executed.",
    description:
      "Steinheim contributes to this development through meticulously engineered bathroom solutions that integrate seamlessly into contemporary interiors — combining German precision with understated elegance.",
    image:
      "https://steinheim-eg.com/cdn/shop/files/freepik_regenerate-this-image-hig_2790157926.png?v=1776254196&width=1200",
    scope: ["Full bathroom systems", "PVD finishes", "Concealed installations"],
  },
  {
    id: "dubai-creek-residence",
    name: "Dubai Creek Residence",
    location: "Dubai Creek, Dubai",
    country: "UAE",
    category: "Branded residences",
    partner: "Park Hyatt",
    tagline: "Luxury as a foundation, not an addition.",
    description:
      "Each space is defined by refined materials, precision craftsmanship, and systems designed to enhance everyday rituals through seamless performance and timeless aesthetics.",
    image:
      "https://steinheim-eg.com/cdn/shop/files/freepik_regenerate-this-image-hig_2790261733.png?v=1776254907&width=1200",
    scope: ["Material-rich interiors", "Concealed systems", "Premium finishes"],
  },
  {
    id: "flamingo-city-sharjah",
    name: "Flamingo City",
    location: "Sharjah",
    country: "UAE",
    category: "Residential development",
    tagline: "Practical design, elevated.",
    description:
      "Steinheim systems bring consistency, durability, and refined simplicity to modern residential living — ensuring every space delivers both function and quiet sophistication.",
    image:
      "https://steinheim-eg.com/cdn/shop/files/freepik_regenerate-this-image-hig_2790282757.png?v=1776255067&width=1200",
    scope: ["Large-scale supply", "Chrome systems", "Basin and shower mixers"],
  },
] as const;

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <PageTransition>
      {/* ── Hero — full-bleed first project image ── */}
      <section className="relative flex min-h-[75svh] items-end overflow-hidden bg-charcoal pt-20 text-white">
        <Image
          src={projects[0].image}
          alt="Steinheim project — The 100, Meydan"
          fill
          priority
          quality={90}
          className="object-cover opacity-35"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />
        <Container className="relative z-10 w-full pb-14 sm:pb-20">
          <ScrollReveal>
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/50">
              Projects &amp; developments
            </p>
            <h1 className="mt-4 max-w-4xl font-heading text-[clamp(3rem,8vw,6rem)] leading-[0.9]">
              Where Steinheim<br />shapes modern living.
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={0.15}>
            <p className="mt-6 max-w-lg text-[15px] leading-[1.8] text-white/45">
              Verified installations across residential and branded-residence
              developments. Precision-engineered bathroom systems designed for
              architectural scale.
            </p>
          </ScrollReveal>
        </Container>
      </section>

      {/* ── Featured project — full width ── */}
      <section className="bg-white">
        <div className="grid lg:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden lg:aspect-auto lg:min-h-[70vh]">
            <Image
              src={projects[0].image}
              alt={projects[0].name}
              fill
              quality={90}
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
          <div className="flex flex-col justify-center px-8 py-14 sm:px-14 lg:px-[8%] lg:py-20">
            <ScrollReveal>
              <p className="font-mono text-[9px] text-warm-gray/50">01</p>
              <p className="mt-4 text-[10px] font-medium uppercase tracking-[0.2em] text-warm-gray">
                {projects[0].category}
              </p>
              <h2 className="mt-3 font-heading text-[clamp(2rem,4vw,3.2rem)] leading-[1.05] text-charcoal">
                {projects[0].name}
              </h2>
              <p className="mt-1 text-[13px] text-warm-gray">{projects[0].location}, {projects[0].country}</p>
              <p className="mt-6 font-heading text-[20px] leading-[1.35] text-charcoal/80">
                {projects[0].tagline}
              </p>
              <p className="mt-4 max-w-md text-[14px] leading-[1.85] text-stone">
                {projects[0].description}
              </p>
              <div className="mt-8 flex flex-wrap gap-2">
                {projects[0].scope.map((item) => (
                  <span
                    key={item}
                    className="border border-border-light px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-warm-gray"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── Project 02 — reversed layout ── */}
      <section className="border-t border-border-light bg-white">
        <div className="grid lg:grid-cols-2">
          <div className="flex flex-col justify-center px-8 py-14 sm:px-14 lg:order-1 lg:px-[8%] lg:py-20">
            <ScrollReveal>
              <p className="font-mono text-[9px] text-warm-gray/50">02</p>
              <div className="mt-4 flex items-center gap-3">
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-warm-gray">
                  {projects[1].category}
                </p>
                {"partner" in projects[1] && (
                  <span className="border border-charcoal/15 px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.1em] text-charcoal">
                    {projects[1].partner}
                  </span>
                )}
              </div>
              <h2 className="mt-3 font-heading text-[clamp(2rem,4vw,3.2rem)] leading-[1.05] text-charcoal">
                {projects[1].name}
              </h2>
              <p className="mt-1 text-[13px] text-warm-gray">{projects[1].location}, {projects[1].country}</p>
              <p className="mt-6 font-heading text-[20px] leading-[1.35] text-charcoal/80">
                {projects[1].tagline}
              </p>
              <p className="mt-4 max-w-md text-[14px] leading-[1.85] text-stone">
                {projects[1].description}
              </p>
              <div className="mt-8 flex flex-wrap gap-2">
                {projects[1].scope.map((item) => (
                  <span
                    key={item}
                    className="border border-border-light px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-warm-gray"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </ScrollReveal>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden lg:order-2 lg:aspect-auto lg:min-h-[70vh]">
            <Image
              src={projects[1].image}
              alt={projects[1].name}
              fill
              quality={90}
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      {/* ── Cinematic video break ── */}
      <section className="bg-charcoal">
        <div className="relative aspect-[21/9] w-full overflow-hidden">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="h-full w-full object-cover"
            poster="/images/lifestyle/32.png"
          >
            <source
              src="https://steinheim-eg.com/cdn/shop/videos/c/vp/2d4afb58a5b949a39d20cb5b3fd5e5d5/2d4afb58a5b949a39d20cb5b3fd5e5d5.HD-1080p-7.2Mbps-79305891.mp4?v=0"
              type="video/mp4"
            />
          </video>
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute inset-0 flex items-center justify-center">
            <ScrollReveal>
              <p className="text-center font-heading text-[clamp(1.4rem,3.5vw,3rem)] leading-[1.15] text-white">
                Engineered for architecture.<br />
                Specified for permanence.
              </p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── Projects 03 & 04 — side by side cards ── */}
      <section className="bg-white py-16 sm:py-24">
        <Container>
          <ScrollReveal>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-warm-gray">
              Continued references
            </p>
          </ScrollReveal>

          <StaggerContainer className="mt-10 grid gap-px bg-border-light md:grid-cols-2">
            {projects.slice(2).map((project, i) => (
              <StaggerItem key={project.id}>
                <article className="group bg-white">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image
                      src={project.image}
                      alt={project.name}
                      fill
                      quality={85}
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                    <div className="absolute bottom-0 left-0 p-6 sm:p-8">
                      <p className="font-mono text-[9px] text-white/35">
                        0{i + 3}
                      </p>
                      <h3 className="mt-2 font-heading text-[clamp(1.5rem,3vw,2.2rem)] leading-[1.1] text-white">
                        {project.name}
                      </h3>
                      <p className="mt-1 text-[11px] text-white/55">
                        {project.location}, {project.country}
                      </p>
                    </div>
                  </div>
                  <div className="p-6 sm:p-8">
                    <div className="flex items-center gap-3">
                      <p className="text-[10px] font-medium uppercase tracking-[0.17em] text-warm-gray">
                        {project.category}
                      </p>
                      {"partner" in project && (
                        <span className="border border-charcoal/15 px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.1em] text-charcoal">
                          {project.partner}
                        </span>
                      )}
                    </div>
                    <p className="mt-4 font-heading text-[18px] leading-[1.3] text-charcoal">
                      {project.tagline}
                    </p>
                    <p className="mt-3 text-[13px] leading-[1.85] text-stone">
                      {project.description}
                    </p>
                    <div className="mt-6 flex flex-wrap gap-2">
                      {project.scope.map((item) => (
                        <span
                          key={item}
                          className="border border-border-light px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-warm-gray"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </Container>
      </section>

      {/* ── Stats ── */}
      <section className="bg-charcoal py-16 text-white sm:py-24">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.4fr_0.6fr]">
            <ScrollReveal>
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/40">
                Track record
              </p>
              <h2 className="mt-4 font-heading text-[clamp(2rem,4.5vw,3.5rem)] leading-[1]">
                Numbers that<br />speak quietly.
              </h2>
              <p className="mt-5 max-w-sm text-[13px] leading-[1.8] text-white/40">
                Every project is a verified installation — not a pitch deck.
                Steinheim systems are specified where long-term performance is
                non-negotiable.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <div className="grid grid-cols-2 gap-px bg-white/10">
                {[
                  { value: "4", label: "Verified project references" },
                  { value: "2", label: "Park Hyatt branded residences" },
                  { value: "1,000+", label: "Residential units supplied" },
                  { value: "3", label: "Cities across the UAE" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-charcoal p-8 sm:p-10">
                    <p className="font-heading text-[clamp(2.2rem,5vw,4rem)] leading-[1] text-white">
                      {stat.value}
                    </p>
                    <p className="mt-3 text-[10px] font-medium uppercase tracking-[0.15em] text-white/35">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </Container>
      </section>

      {/* ── What we supply ── */}
      <section className="bg-white py-16 sm:py-24">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[0.35fr_0.65fr]">
            <ScrollReveal>
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-warm-gray">
                Project specification
              </p>
              <h2 className="mt-4 font-heading text-[clamp(1.8rem,3.5vw,2.8rem)] leading-[1.05] text-charcoal">
                What Steinheim supplies to developments.
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <StaggerContainer className="grid gap-px border-t border-charcoal sm:grid-cols-2">
                {[
                  {
                    title: "Basin mixers",
                    detail: "Single-lever, tall, wall-mounted — across all four collections. Sedal ceramic cartridge with lifetime warranty.",
                  },
                  {
                    title: "Shower systems",
                    detail: "Concealed and exposed configurations. Thermostatic and single-lever options with Neoperl aerators.",
                  },
                  {
                    title: "Bath mixers",
                    detail: "Floor-standing and wall-mounted. Designed for freestanding and built-in bath installations.",
                  },
                  {
                    title: "Premium finishes",
                    detail: "Chrome, Brushed Nickel, Matte Black, Brushed Gold, Coffee Gold, Metal Gun. PVD coating on all specialty finishes.",
                  },
                ].map((item) => (
                  <StaggerItem key={item.title}>
                    <div className="border-b border-border-light py-6 sm:py-8">
                      <h3 className="text-[10px] font-medium uppercase tracking-[0.17em] text-charcoal">
                        {item.title}
                      </h3>
                      <p className="mt-3 text-[13px] leading-[1.8] text-stone">
                        {item.detail}
                      </p>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </ScrollReveal>
          </div>
        </Container>
      </section>

      {/* ── Trade CTA ── */}
      <section className="relative overflow-hidden bg-charcoal py-24 sm:py-32 lg:py-40">
        <Image
          src="/images/lifestyle/22.png"
          alt=""
          fill
          className="object-cover opacity-15"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal/50 via-charcoal/30 to-charcoal/70" />
        <Container className="relative z-10">
          <ScrollReveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-[9px] font-medium uppercase tracking-[0.25em] text-white/30">
                For developers, architects, and specifiers
              </p>
              <p className="mt-6 font-heading text-[clamp(2rem,5vw,3.8rem)] leading-[1.05] text-white">
                Specify Steinheim for<br />your next project.
              </p>
              <p className="mx-auto mt-6 max-w-lg text-[14px] leading-[1.85] text-white/40">
                Contact the trade team for project pricing, technical
                documentation, specification sheets, and volume supply.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/trade"
                  className="inline-flex h-[50px] items-center gap-3 border border-white/25 bg-white/8 px-8 text-[10px] font-medium uppercase tracking-[0.15em] text-white backdrop-blur-sm transition-all duration-300 hover:bg-white hover:text-charcoal"
                >
                  Trade enquiries
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex h-[50px] items-center px-8 text-[10px] font-medium uppercase tracking-[0.15em] text-white/45 transition hover:text-white"
                >
                  Contact us →
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </Container>
      </section>
    </PageTransition>
  );
}
