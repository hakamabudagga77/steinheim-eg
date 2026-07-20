import { getTranslations, setRequestLocale } from "next-intl/server";
import PageTransition from "@/components/layout/PageTransition";
import ScrollReveal from "@/components/ui/ScrollReveal";

export const metadata = {
  title: "Shipping Policy | Steinheim Egypt",
  description:
    "Delivery information for Steinheim premium bathroom fixtures across Egypt. Free shipping on orders above LE 15,000 within Greater Cairo.",
};

const sectionKeys = [
  "deliveryAreas",
  "shippingCosts",
  "processingTime",
  "estimatedDelivery",
  "orderTracking",
  "inspection",
  "questions",
] as const;

export default async function ShippingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("shippingPage");
  const tc = await getTranslations("policyCommon");

  const sections = sectionKeys.map((key) => ({
    key,
    title: t(`sections.${key}.title`),
    content: t.raw(`sections.${key}.content`) as string[],
  }));

  return (
    <PageTransition>
      <section className="bg-charcoal pt-[124px]">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
          <div className="py-16 sm:py-20 lg:py-28">
            <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-white/30">
              {tc("policy")}
            </p>
            <h1 className="mt-5 max-w-2xl font-heading text-[clamp(2.4rem,5vw,4.2rem)] leading-[1.05] text-white">
              {t("title")}
            </h1>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-[780px] px-5 sm:px-8 py-16 sm:py-24 lg:py-32">
          {sections.map((section, i) => (
            <ScrollReveal key={section.key}>
              <div className={i > 0 ? "mt-12 border-t border-charcoal/8 pt-12" : ""}>
                <h2 className="font-heading text-[22px] text-charcoal sm:text-[26px]">
                  {section.title}
                </h2>
                <div className="mt-5 space-y-4">
                  {section.content.map((paragraph, j) => (
                    <p
                      key={j}
                      className="text-[14px] leading-[1.8] text-warm-gray sm:text-[15px]"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          ))}

          <div className="mt-16 border-t border-charcoal/8 pt-8">
            <p className="text-[11px] text-warm-gray/50">
              {tc("lastUpdated")}
            </p>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
