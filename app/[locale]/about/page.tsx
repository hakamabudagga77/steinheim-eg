import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import ScrollReveal, { StaggerContainer, StaggerItem } from "@/components/ui/ScrollReveal";
import PageTransition from "@/components/layout/PageTransition";
import WorldCard from "@/components/about/WorldCard";
import AutoplayVideo from "@/components/ui/AutoplayVideo";
import { Link } from "@/i18n/navigation";

const heroVideo = "/videos/joy-shower-macro.mp4";

const craftVideo = "/videos/art-hero.mp4";

const worldCardMeta = [
  {
    key: "company" as const,
    image: "/images/generated/gessi/steinheim-specification-story.png",
    hoverImage: "/images/steinheim/karim-2026/home-joy.webp",
    href: "#identity",
  },
  {
    key: "collections" as const,
    image: "/images/generated/gessi/steinheim-collection-plinths.png",
    hoverImage: "/images/steinheim/karim-2026/landing-art.webp",
    href: "/collections",
  },
  {
    key: "finishes" as const,
    image: "/images/generated/gessi/steinheim-finish-stack.png",
    hoverImage: "/images/steinheim/karim-2026/landing-joy.webp",
    href: "#finishes",
  },
  {
    key: "trade" as const,
    image: "/images/generated/gessi/steinheim-wellness-architecture.png",
    hoverImage: "/images/steinheim/karim-2026/home-art.webp",
    href: "/trade",
  },
];

const qualityItemKeys = ["reliability", "finish", "specification", "support"] as const;

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("aboutPage");

  const worldCards = worldCardMeta.map((meta) => ({
    title: t(`world.cards.${meta.key}.title`),
    eyebrow: t(`world.cards.${meta.key}.eyebrow`),
    image: meta.image,
    hoverImage: meta.hoverImage,
    href: meta.href,
  }));

  const tabs = [
    [t("tabs.intro"), "#intro"],
    [t("tabs.identity"), "#identity"],
    [t("tabs.quality"), "#quality"],
    [t("tabs.finishes"), "#finishes"],
    [t("tabs.trade"), "#trade"],
  ];

  return (
    <PageTransition>
      <main className="bg-[#ece9e2] text-[#0a0a0a] text-start">
        <section id="intro" className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-black text-white">
          <AutoplayVideo
            src={heroVideo}
            poster="/images/steinheim/final/about-hero.jpg"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/35" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/45" />

          <div className="absolute start-5 top-28 z-10 hidden text-[16px] font-medium text-white/85 sm:start-10 lg:start-16 lg:block">
            <span>{t("breadcrumb.home")}</span>
            <span className="px-2 text-white/45">·</span>
            <span>{t("breadcrumb.world")}</span>
            <span className="px-2 text-white/45">·</span>
            <span>{t("breadcrumb.company")}</span>
          </div>

          <div className="relative z-10 mx-auto w-full max-w-[1500px] px-5 text-center sm:px-8 lg:px-16">
            <ScrollReveal>
              <p className="text-[12px] uppercase tracking-[0.45em] text-white/70">{t("hero.eyebrow")}</p>
              <h1 className="mx-auto mt-8 max-w-6xl text-[clamp(3.7rem,8vw,9rem)] font-light leading-[0.96] tracking-[-0.065em]">
                {t("hero.headline")}
              </h1>
            </ScrollReveal>
          </div>

          <div className="pointer-events-auto absolute bottom-7 start-1/2 z-20 hidden -translate-x-1/2 rtl:translate-x-1/2 rounded-full bg-[#ece9e2]/86 p-1.5 text-[13px] shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur-md md:flex">
            {tabs.map(([label, href], index) => (
              <a
                key={label}
                href={href}
                className={`rounded-full px-6 py-3 transition hover:bg-white ${index === 0 ? "bg-white" : "text-black/70"}`}
              >
                {label}
              </a>
            ))}
          </div>
        </section>

        <section className="px-5 py-20 sm:px-8 lg:px-16 lg:py-28">
          <div className="mx-auto max-w-[1780px]">
            <ScrollReveal className="text-center">
              <p className="text-[11px] uppercase tracking-[0.42em] text-black/42">{t("world.eyebrow")}</p>
              <h2 className="mt-8 text-[clamp(2.2rem,4.5vw,4.7rem)] font-light leading-none tracking-[-0.055em]">
                {t("world.headline")}
              </h2>
            </ScrollReveal>

            <StaggerContainer className="mt-16 grid gap-8 md:grid-cols-2 xl:grid-cols-4">
              {worldCards.map((card) => (
                <StaggerItem key={card.title}>
                  <WorldCard card={card} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        <section id="identity" className="px-5 py-20 sm:px-8 lg:px-16 lg:py-28">
          <div className="mx-auto grid max-w-[1780px] items-center gap-16 lg:grid-cols-[0.54fr_0.46fr] lg:gap-28">
            <ScrollReveal>
              <div className="relative aspect-[16/10] overflow-hidden bg-black">
                <Image
                  src="/images/generated/gessi/steinheim-specification-story.png"
                  alt="Steinheim product craftsmanship and surface detailing"
                  fill
                  quality={92}
                  sizes="(min-width: 1024px) 54vw, 100vw"
                  className="object-cover"
                />
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.1}>
              <p className="text-[13px] uppercase tracking-[0.36em] text-black/70">{t("identity.eyebrow")}</p>
              <h2 className="mt-8 max-w-2xl text-[clamp(2.8rem,5vw,5.6rem)] font-light leading-[0.98] tracking-[-0.065em]">
                {t("identity.headline")}
              </h2>
              <p className="mt-9 max-w-2xl text-[18px] leading-[1.75] text-black/75">
                {t("identity.body")}
              </p>
              <Link
                href="/collections"
                className="mt-10 inline-flex rounded-full border border-black px-8 py-3 text-[15px] transition hover:bg-black hover:text-white"
              >
                {t("identity.cta")}
              </Link>
            </ScrollReveal>
          </div>
        </section>

        <section className="px-5 py-20 sm:px-8 lg:px-16 lg:py-28">
          <div className="mx-auto grid max-w-[1780px] items-start gap-16 lg:grid-cols-[0.44fr_0.56fr] lg:gap-28">
            <ScrollReveal>
              <p className="text-[13px] uppercase tracking-[0.36em] text-black/70">{t("european.eyebrow")}</p>
              <h2 className="mt-8 max-w-xl text-[clamp(2.7rem,4.7vw,5rem)] font-light leading-[0.98] tracking-[-0.065em]">
                {t("european.headline")}
              </h2>
              <p className="mt-8 max-w-xl text-[17px] leading-[1.8] text-black/70">
                {t("european.body")}
              </p>
              <Link
                href="/trade"
                className="mt-10 inline-flex rounded-full border border-black px-8 py-3 text-[15px] transition hover:bg-black hover:text-white"
              >
                {t("european.cta")}
              </Link>
            </ScrollReveal>

            <ScrollReveal delay={0.1}>
              <div className="relative aspect-[16/9] overflow-hidden bg-black">
                <Image
                  src="/images/generated/gessi/steinheim-warm-wall-mounted-basin.png"
                  alt="Steinheim complete bathroom system"
                  fill
                  quality={92}
                  sizes="(min-width: 1024px) 56vw, 100vw"
                  className="object-cover"
                />
              </div>
            </ScrollReveal>
          </div>
        </section>

        <section className="relative min-h-[72svh] overflow-hidden bg-black text-white">
          <AutoplayVideo src={craftVideo} className="absolute inset-0 h-full w-full object-cover object-center" />
          <div className="absolute inset-0 bg-black/38" />
          <div className="relative z-10 mx-auto flex min-h-[76svh] max-w-[1780px] items-center px-5 sm:px-8 lg:px-16">
            <ScrollReveal>
              <h2 className="max-w-5xl text-[clamp(3rem,7.2vw,8rem)] font-light leading-[0.98] tracking-[-0.07em]">
                {t("excellence.headline")}
              </h2>
            </ScrollReveal>
          </div>
        </section>

        <section id="quality" className="relative overflow-hidden px-5 py-20 sm:px-8 lg:px-16 lg:py-28">
          <Image
            src="/images/generated/gessi/steinheim-specification-story.png"
            alt=""
            aria-hidden="true"
            fill
            sizes="100vw"
            className="object-cover opacity-18 blur-[2px]"
          />
          <div className="absolute inset-0 bg-[#ece9e2]/78" />
          <div className="relative mx-auto max-w-[1780px] rounded-[14px] bg-[#ece9e2]/82 px-8 py-14 backdrop-blur-sm sm:px-12 lg:px-20 lg:py-20">
            <div className="grid gap-14 lg:grid-cols-[0.48fr_0.52fr]">
              <ScrollReveal>
                <h2 className="text-[clamp(3rem,5.6vw,6.2rem)] font-light leading-none tracking-[-0.07em]">
                  {t("quality.headline")}
                </h2>
                <p className="mt-10 max-w-xl text-[18px] leading-[1.75] text-black/72">
                  {t("quality.body")}
                </p>
              </ScrollReveal>

              <StaggerContainer className="space-y-5">
                {qualityItemKeys.map((key, index) => (
                  <StaggerItem key={key}>
                    <article className="grid gap-6 border-b border-black/14 pb-7 sm:grid-cols-[72px_1fr]">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-black/32 text-[22px]">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="text-[clamp(1.8rem,3vw,3rem)] font-light leading-tight tracking-[-0.055em]">
                          {t(`quality.items.${key}.title`)}
                        </h3>
                        <p className="mt-3 max-w-2xl text-[16px] leading-[1.75] text-black/62">
                          {t(`quality.items.${key}.body`)}
                        </p>
                      </div>
                    </article>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </div>
          </div>
        </section>

        <section id="finishes" className="px-5 py-20 sm:px-8 lg:px-16 lg:py-28">
          <div className="mx-auto grid max-w-[1780px] items-center gap-16 lg:grid-cols-[0.58fr_0.42fr] lg:gap-28">
            <ScrollReveal>
              <div className="relative aspect-[16/10] overflow-hidden rounded-[28px] bg-white">
                <Image
                  src="/images/generated/gessi/steinheim-finish-stack.png"
                  alt="Steinheim finish stack"
                  fill
                  quality={95}
                  sizes="(min-width: 1024px) 58vw, 100vw"
                  className="object-cover"
                />
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.1}>
              <p className="text-[13px] uppercase tracking-[0.36em] text-black/70">{t("finishes.eyebrow")}</p>
              <h2 className="mt-8 max-w-2xl text-[clamp(2.8rem,5vw,5.5rem)] font-light leading-[0.98] tracking-[-0.065em]">
                {t("finishes.headline")}
              </h2>
              <p className="mt-9 max-w-2xl text-[18px] leading-[1.75] text-black/72">
                {t("finishes.body")}
              </p>
              <Link
                href="/collections"
                className="mt-10 inline-flex rounded-full border border-black px-8 py-3 text-[15px] transition hover:bg-black hover:text-white"
              >
                {t("finishes.cta")}
              </Link>
            </ScrollReveal>
          </div>
        </section>

        <section id="trade" className="px-5 pb-24 sm:px-8 lg:px-16 lg:pb-32">
          <div className="relative mx-auto min-h-[72svh] max-w-[1780px] overflow-hidden bg-black text-white">
            <Image
              src="/images/generated/gessi/steinheim-wellness-architecture.png"
              alt="Steinheim trade and project specification"
              fill
              quality={92}
              sizes="100vw"
              className="object-cover opacity-52"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/78 via-black/38 to-black/18" />
            <div className="relative z-10 flex min-h-[72svh] max-w-3xl flex-col justify-center px-8 py-20 sm:px-14 lg:px-20">
              <ScrollReveal>
                <p className="text-[12px] uppercase tracking-[0.42em] text-white/62">{t("trade.eyebrow")}</p>
                <h2 className="mt-8 text-[clamp(3rem,6vw,6.5rem)] font-light leading-[0.96] tracking-[-0.07em]">
                  {t("trade.headline")}
                </h2>
                <p className="mt-8 max-w-2xl text-[18px] leading-[1.75] text-white/72">
                  {t("trade.body")}
                </p>
                <Link
                  href="/trade"
                  className="mt-10 inline-flex w-fit rounded-full border border-white px-8 py-3 text-[15px] transition hover:bg-white hover:text-black"
                >
                  {t("trade.cta")}
                </Link>
              </ScrollReveal>
            </div>
          </div>
        </section>
      </main>
    </PageTransition>
  );
}
