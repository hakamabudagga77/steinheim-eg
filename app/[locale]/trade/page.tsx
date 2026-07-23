import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import ScrollReveal from "@/components/ui/ScrollReveal";
import PageTransition from "@/components/layout/PageTransition";
import AutoplayVideo from "@/components/ui/AutoplayVideo";
import TradeOpenButton from "@/components/trade/TradeOpenButton";
import SmartRoomCalculator from "@/components/trade/SmartRoomCalculator";

const stepKeys = ["setRooms", "assign", "editAnytime", "submit"] as const;
const benefitKeys = ["pricing", "support", "scheduling", "access"] as const;

export default async function TradePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("tradePage");

  return (
    <PageTransition>
      <div className="bg-[#ece9e2] text-[#0a0a0a]">
        {/* Hero */}
        <section className="relative flex min-h-[75svh] items-end overflow-hidden bg-black pt-20 text-white text-start">
          <AutoplayVideo
            src="/videos/showroom/showroom-3.mp4"
            poster="/images/generated/gessi/steinheim-wellness-architecture.png"
            className="absolute inset-0 h-full w-full object-cover object-[center_52%] opacity-62"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
          <div className="relative z-10 mx-auto w-full max-w-[1780px] px-5 pb-14 sm:px-8 lg:px-16 lg:pb-20">
            <ScrollReveal>
              <p className="text-[11px] uppercase tracking-[0.45em] text-white/45">{t("eyebrow")}</p>
              <h1
                className="mt-5 max-w-4xl font-heading text-[clamp(3rem,7.5vw,7.5rem)] leading-[0.88] tracking-[-0.04em]"
                style={{ fontStyle: "italic" }}
              >
                {t("headline")}
              </h1>
              <p className="mt-6 max-w-xl text-[16px] leading-[1.85] text-white/55">
                {t("body")}
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-3">
                <a
                  href="#smart-room-calculator"
                  className="rounded-full border border-white/40 px-10 py-4 text-[13px] font-medium text-white transition hover:bg-white hover:text-black"
                >
                  {t("setupProperty")}
                </a>
                <TradeOpenButton variant="outline-light" />
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* How it works — Gessi editorial: horizontal dividers, italic serif titles */}
        <section className="px-5 py-24 sm:px-8 lg:px-16 lg:py-32 text-start">
          <div className="mx-auto max-w-[1780px]">
            <ScrollReveal>
              <p className="text-[12px] uppercase tracking-[0.34em] text-black/40">{t("howItWorks")}</p>
              <h2 className="mt-4 max-w-3xl text-[clamp(2.4rem,5vw,5.6rem)] font-normal leading-[0.92] tracking-[-0.04em]" style={{ fontStyle: "italic" }}>
                {t("howHeadline")}
              </h2>
              <p className="mt-5 max-w-2xl text-[15px] leading-[1.85] text-black/50">
                {t("howBody")}
              </p>
            </ScrollReveal>

            <div className="mt-16 border-t border-black/10">
              {stepKeys.map((key) => (
                <div key={key} className="flex flex-col gap-2 border-b border-black/8 py-8 sm:flex-row sm:items-start sm:gap-12">
                  <h3 className="shrink-0 font-heading text-[20px] sm:w-[220px]" style={{ fontStyle: "italic" }}>{t(`steps.${key}.title`)}</h3>
                  <p className="text-[14px] leading-[1.75] text-black/50">{t(`steps.${key}.body`)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trade partner benefits */}
        <section className="border-t border-black/6 px-5 py-24 sm:px-8 lg:px-16 lg:py-32 text-start">
          <div className="mx-auto max-w-[1780px]">
            <ScrollReveal>
              <p className="text-[12px] uppercase tracking-[0.34em] text-black/40">{t("benefits.eyebrow")}</p>
              <h2 className="mt-4 max-w-3xl text-[clamp(2.4rem,5vw,5.6rem)] font-normal leading-[0.92] tracking-[-0.04em]" style={{ fontStyle: "italic" }}>
                {t("benefits.headline")}
              </h2>
              <p className="mt-5 max-w-2xl text-[15px] leading-[1.85] text-black/50">
                {t("benefits.body")}
              </p>
            </ScrollReveal>

            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {benefitKeys.map((key) => (
                <div key={key} className="border-t border-black/10 pt-6">
                  <h3 className="font-heading text-[18px]" style={{ fontStyle: "italic" }}>{t(`benefits.items.${key}.title`)}</h3>
                  <p className="mt-2 text-[13.5px] leading-[1.7] text-black/50">{t(`benefits.items.${key}.body`)}</p>
                </div>
              ))}
            </div>

            <div className="mt-14">
              <Link
                href="/contact"
                className="inline-flex rounded-full border border-black/25 px-9 py-4 text-[13px] font-medium transition hover:bg-black hover:text-white"
              >
                {t("benefits.cta")}
              </Link>
            </div>
          </div>
        </section>

        <Suspense fallback={null}>
          <SmartRoomCalculator />
        </Suspense>

        {/* Browse CTA */}
        <section className="px-5 pb-24 sm:px-8 lg:px-16 lg:pb-32 text-start">
          <div className="mx-auto max-w-[1780px]">
            <div className="grid items-center gap-10 rounded-[22px] bg-black p-8 text-white sm:p-12 lg:grid-cols-[1.2fr_0.8fr] lg:p-16">
              <div>
                <p className="text-[11px] uppercase tracking-[0.4em] text-white/35">{t("alreadyKnow")}</p>
                <h2 className="mt-4 text-[clamp(2rem,4.5vw,4.4rem)] leading-[0.95] tracking-[-0.03em]" style={{ fontStyle: "italic" }}>
                  {t("browseHeadline")}
                </h2>
              </div>
              <div className="flex flex-wrap gap-3 lg:justify-end">
                <Link
                  href="/collections"
                  className="rounded-full border border-white/40 px-8 py-4 text-[13px] font-medium text-white transition hover:bg-white hover:text-black"
                >
                  {t("browseCollections")}
                </Link>
                <TradeOpenButton variant="outline-light" />
              </div>
            </div>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
