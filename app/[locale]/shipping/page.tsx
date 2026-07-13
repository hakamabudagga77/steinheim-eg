import { setRequestLocale } from "next-intl/server";
import PageTransition from "@/components/layout/PageTransition";
import ScrollReveal from "@/components/ui/ScrollReveal";

export const metadata = {
  title: "Shipping Policy | Steinheim Egypt",
  description:
    "Delivery information for Steinheim premium bathroom fixtures across Egypt. Free shipping on orders above LE 15,000 within Greater Cairo.",
};

export default async function ShippingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sections = [
    {
      title: "Delivery areas",
      content: [
        "We deliver Steinheim products throughout the Arab Republic of Egypt. All orders are shipped from our Cairo warehouse.",
        "For addresses outside Greater Cairo, delivery timelines may vary depending on the governorate.",
      ],
    },
    {
      title: "Shipping costs",
      content: [
        "Orders above LE 15,000: Free delivery within Greater Cairo.",
        "Orders below LE 15,000: A flat shipping fee of LE 250 applies within Greater Cairo.",
        "Outside Greater Cairo: Shipping is calculated based on destination and order weight. You will be informed of the exact cost before confirming your order.",
      ],
    },
    {
      title: "Processing time",
      content: [
        "Orders are processed within 1–3 business days. You will receive a confirmation email once your order has been dispatched.",
        "Business days are Sunday through Thursday, 9:00 AM to 5:00 PM (Cairo time). Orders placed on Fridays, Saturdays, or public holidays will be processed on the next business day.",
      ],
    },
    {
      title: "Estimated delivery",
      content: [
        "Greater Cairo: 2–5 business days after dispatch.",
        "Alexandria, Delta, and Canal Zone: 4–7 business days.",
        "Upper Egypt and remote areas: 7–12 business days.",
        "These are estimates. Actual delivery times may vary during peak seasons or due to circumstances beyond our control.",
      ],
    },
    {
      title: "Order tracking",
      content: [
        "Once your order is dispatched, you will receive a tracking number via email or WhatsApp. You can use this to monitor your shipment status.",
      ],
    },
    {
      title: "Inspection on delivery",
      content: [
        "We recommend inspecting your package at the time of delivery. If the outer packaging appears damaged, please note this on the delivery receipt and contact us within 24 hours.",
        "All products are carefully packaged to ensure they arrive in perfect condition.",
      ],
    },
    {
      title: "Questions",
      content: [
        "For any shipping-related enquiries, contact us at inquiries@steinheim-eg.com or via WhatsApp at +20 122 399 8124.",
      ],
    },
  ];

  return (
    <PageTransition>
      <section className="bg-charcoal pt-8">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
          <div className="py-16 sm:py-20 lg:py-28">
            <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-white/30">
              Policy
            </p>
            <h1 className="mt-5 max-w-2xl font-heading text-[clamp(2.4rem,5vw,4.2rem)] leading-[1.05] text-white">
              Shipping &amp; delivery
            </h1>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-[780px] px-5 sm:px-8 py-16 sm:py-24 lg:py-32">
          {sections.map((section, i) => (
            <ScrollReveal key={section.title}>
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
              Last updated: June 2026. This policy applies to orders placed through steinheim-eg.com.
            </p>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
