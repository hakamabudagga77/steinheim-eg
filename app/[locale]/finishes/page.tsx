import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import PageTransition from "@/components/layout/PageTransition";
import ScrollReveal, { StaggerContainer, StaggerItem } from "@/components/ui/ScrollReveal";
import { getAllFinishes, getAllProducts, getSeriesById } from "@/lib/utils";
import { getFinishDiscImage } from "@/data/images";
import { getStaticPageMetadata } from "@/lib/seo";

// Message keys are camelCase while finish ids are kebab-case.
const MESSAGE_KEY: Record<string, string> = {
  chrome: "chrome",
  "brushed-nickel": "brushedNickel",
  "matte-black": "matteBlack",
  "brushed-gold": "brushedGold",
  "coffee-gold": "coffeeGold",
  "metal-gun": "metalGun",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return getStaticPageMetadata(locale, "/finishes", "finishes");
}

export default async function FinishesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("finishes");

  const finishes = getAllFinishes();
  const products = getAllProducts();

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: finishes.flatMap((finish) => {
      const key = MESSAGE_KEY[finish.id];
      if (!key) return [];
      const name = t(`${key}.name`);
      const seriesNames = finish.series
        .map((id) => getSeriesById(id)?.name ?? id)
        .filter(Boolean)
        .join(" · ");
      return [
        {
          "@type": "Question",
          name: t("faq.whatIs", { name }),
          acceptedAnswer: { "@type": "Answer", text: t(`${key}.description`) },
        },
        {
          "@type": "Question",
          name: t("faq.availableIn", { name }),
          acceptedAnswer: { "@type": "Answer", text: seriesNames },
        },
        {
          "@type": "Question",
          name: t("faq.care", { name }),
          acceptedAnswer: { "@type": "Answer", text: t(`${key}.care`) },
        },
      ];
    }),
  };

  return (
    <PageTransition>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="bg-white">
        <section className="px-5 pb-16 pt-28 sm:px-8 lg:px-16 lg:pb-24 lg:pt-36">
          <div className="mx-auto max-w-[1780px]">
            <ScrollReveal>
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-warm-gray">
                {t("title")}
              </p>
              <h1
                className="mt-4 max-w-[16ch] font-heading text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.05] text-charcoal"
                style={{ fontStyle: "italic" }}
              >
                {t("heroHeadline")}
              </h1>
              <p className="mt-6 max-w-[62ch] text-[15px] leading-relaxed text-warm-gray">
                {t("heroBody")}
              </p>
            </ScrollReveal>
          </div>
        </section>

        <StaggerContainer className="mx-auto max-w-[1780px] px-5 pb-24 sm:px-8 lg:px-16 lg:pb-32">
          <div className="divide-y divide-charcoal/8 border-y border-charcoal/8">
            {finishes.map((finish) => {
              const key = MESSAGE_KEY[finish.id];
              if (!key) return null;
              const disc = getFinishDiscImage(finish.id);
              // Only the series this finish is actually offered in — the data
              // file is the guard (brushed-nickel is not on quatro, and so on).
              const seriesNames = finish.series
                .map((id) => getSeriesById(id)?.name ?? id)
                .filter(Boolean);
              const productCount = products.filter((product) =>
                product.variants.some((variant) => variant.finish === finish.id)
              ).length;

              return (
                <StaggerItem key={finish.id}>
                  <article className="grid gap-8 py-14 lg:grid-cols-[0.4fr_0.6fr] lg:gap-16 lg:py-20">
                    <div className="relative aspect-[4/5] max-h-[460px] overflow-hidden bg-[#ece9e2]">
                      {disc && (
                        <Image
                          src={disc}
                          alt={t(`${key}.name`)}
                          fill
                          sizes="(min-width: 1024px) 40vw, 100vw"
                          className="object-cover"
                        />
                      )}
                    </div>

                    <div className="flex flex-col justify-center">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-warm-gray">
                          {t("code")} {finish.code}
                        </span>
                        <span className="h-3 w-px bg-charcoal/15" aria-hidden="true" />
                        <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-warm-gray">
                          {finish.type === "pvd" ? t("pvd") : t("standard")}
                        </span>
                      </div>

                      <h2 className="mt-3 font-heading text-[clamp(1.9rem,3.5vw,2.75rem)] leading-tight text-charcoal">
                        {t(`${key}.name`)}
                      </h2>

                      <p className="mt-4 max-w-[58ch] text-[15px] leading-relaxed text-warm-gray">
                        {t(`${key}.description`)}
                      </p>

                      <dl className="mt-8 grid gap-6 sm:grid-cols-2">
                        <div>
                          <dt className="text-[10px] font-medium uppercase tracking-[0.14em] text-warm-gray/70">
                            {t("availableIn")}
                          </dt>
                          <dd className="mt-2 text-[13px] leading-relaxed text-charcoal">
                            {seriesNames.join(" · ")}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[10px] font-medium uppercase tracking-[0.14em] text-warm-gray/70">
                            {t("careInstructions")}
                          </dt>
                          <dd className="mt-2 text-[13px] leading-relaxed text-warm-gray">
                            {t(`${key}.care`)}
                          </dd>
                        </div>
                      </dl>

                      {productCount > 0 && (
                        <Link
                          href={`/products?finish=${finish.id}`}
                          className="mt-8 inline-flex h-11 w-fit items-center border border-charcoal/15 px-7 text-[10px] font-medium uppercase tracking-[0.15em] text-charcoal transition hover:border-charcoal"
                        >
                          {t("viewProducts")}
                        </Link>
                      )}
                    </div>
                  </article>
                </StaggerItem>
              );
            })}
          </div>
        </StaggerContainer>
      </div>
    </PageTransition>
  );
}
