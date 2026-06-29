import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import ScrollReveal from "@/components/ui/ScrollReveal";
import PageTransition from "@/components/layout/PageTransition";

export default async function WarrantyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <WarrantyPageContent />;
}

function WarrantyPageContent() {
  const t = useTranslations("warranty");

  const warrantyTiers = [
    {
      term: t("lifetime"),
      coverage: t("sedalCartridges"),
      note: "The heart of every fixture — engineered to outlast the space it serves.",
    },
    {
      term: t("tenYear"),
      coverage: t("chromeNickelFinishes"),
      note: "Classic finishes with enduring reflective clarity.",
    },
    {
      term: t("fiveYear"),
      coverage: t("neoperlAerators"),
      note: "Precision flow technology and solid brass construction.",
    },
    {
      term: t("threeYear"),
      coverage: t("pvdFinishes"),
      note: "Physical Vapour Deposition for scratch-resistant speciality tones.",
    },
  ];

  return (
    <PageTransition>
      <section className="relative min-h-[55svh] overflow-hidden bg-charcoal pt-20 text-white sm:min-h-[50svh]">
        <Image
          src="/images/lifestyle/23.png"
          alt="Steinheim bathroom detail"
          fill
          priority
          sizes="100vw"
          quality={90}
          className="object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/40 to-charcoal/20" />
        <div className="absolute inset-x-0 bottom-0 z-10 mx-auto max-w-[1600px] px-5 pb-14 sm:px-8 sm:pb-20 lg:px-10">
          <p className="mb-5 text-[10px] font-medium uppercase tracking-[0.25em] text-white/50">
            Product assurance
          </p>
          <h1 className="max-w-3xl font-heading text-[clamp(3rem,7vw,7rem)] leading-[0.85]">
            {t("title")}
          </h1>
          <p className="mt-6 max-w-xl text-[15px] leading-[1.85] text-white/65">
            Every Steinheim fixture is built to endure. Our warranty reflects the
            confidence we place in German engineering and precision manufacturing.
          </p>
        </div>
      </section>

      <section className="border-b border-border-light bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-10">
          <ScrollReveal>
            <div className="mb-14 max-w-2xl">
              <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-warm-gray">
                Coverage tiers
              </p>
              <h2 className="mt-4 font-heading text-[clamp(2rem,4vw,3.8rem)] leading-[1] text-charcoal">
                Protection matched to material performance.
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {warrantyTiers.map((tier, i) => (
              <ScrollReveal key={tier.term} delay={i * 0.06}>
                <div className="flex h-full flex-col border border-border-light bg-[#FAFAF8] p-6 sm:p-7">
                  <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-charcoal">
                    {tier.term}
                  </p>
                  <p className="mt-3 text-[14px] leading-[1.7] text-stone">
                    {tier.coverage}
                  </p>
                  <div className="mt-auto pt-6">
                    <div className="mb-3 h-px w-8 bg-charcoal/15" />
                    <p className="text-[12px] leading-[1.65] text-warm-gray">
                      {tier.note}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal>
            <p className="mt-8 text-[12px] tracking-wide text-warm-gray">
              {t("validInEgypt")}
            </p>
          </ScrollReveal>
        </div>
      </section>

      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto grid max-w-[1600px] gap-10 px-5 sm:px-8 lg:grid-cols-[0.55fr_1fr] lg:gap-16 lg:px-10">
          <ScrollReveal>
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-warm-gray">
              Filing a claim
            </p>
            <h2 className="mt-4 font-heading text-[clamp(2rem,4vw,3.8rem)] leading-[1] text-charcoal">
              {t("claimsProcess")}
            </h2>
          </ScrollReveal>

          <ScrollReveal delay={0.08}>
            <div className="space-y-6 text-[15px] leading-[1.85] text-stone">
              <p>
                To file a warranty claim, contact your point of purchase or reach
                out to El Sharbatly International Group directly at{" "}
                <a
                  href="mailto:inquiries@steinheim-eg.com"
                  className="text-charcoal underline underline-offset-4 transition hover:text-warm-gray"
                >
                  inquiries@steinheim-eg.com
                </a>
                .
              </p>
              <p>
                Please provide your proof of purchase, product model number, date
                of installation, and a description of the defect. Photos of the
                issue are helpful for faster processing.
              </p>
              <p>
                Warranty claims are typically processed within 14 business days.
                Replacement parts or units will be provided at no cost for valid
                claims within the warranty period.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-border-light bg-charcoal py-24 text-white sm:py-32 lg:py-40">
        <Image
          src="/images/lifestyle/27.png"
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-15"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal/50 via-charcoal/30 to-charcoal/70" />
        <div className="relative z-10 mx-auto grid max-w-[1600px] gap-10 px-5 sm:px-8 lg:grid-cols-[1fr_auto] lg:items-center lg:px-10">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/45">
              Need assistance?
            </p>
            <h2 className="mt-4 max-w-3xl font-heading text-[clamp(2.2rem,4.8vw,5rem)] leading-[0.95]">
              Our team is here to help with any product concern.
            </h2>
          </div>
          <Link
            href="/contact"
            className="self-center border border-white/25 bg-white/5 px-8 py-4 text-center text-[11px] font-medium uppercase tracking-[0.16em] text-white backdrop-blur-sm transition hover:border-white hover:bg-white/10"
          >
            Get in touch
          </Link>
        </div>
      </section>
    </PageTransition>
  );
}
