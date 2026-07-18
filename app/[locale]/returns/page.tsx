import { setRequestLocale } from "next-intl/server";
import PageTransition from "@/components/layout/PageTransition";
import ScrollReveal from "@/components/ui/ScrollReveal";

export const metadata = {
  title: "Returns & Exchange Policy | Steinheim Egypt",
  description:
    "Return and exchange policy for Steinheim premium bathroom fixtures. 14-day return window for unused products in original packaging.",
};

export default async function ReturnsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sections = [
    {
      title: "Return eligibility",
      content: [
        "We accept returns within 14 days of delivery, provided the product is unused, uninstalled, and in its original sealed packaging with all accessories and documentation included.",
        "Items that have been installed, modified, or show signs of use are not eligible for return.",
      ],
    },
    {
      title: "Non-returnable items",
      content: [
        "The following items cannot be returned or exchanged:",
        "• Products that have been installed or connected to plumbing",
        "• Custom or special-order finishes not part of the standard catalogue",
        "• Accessories with broken seals (angle valves, click-clack wastes, bidet sprays) once packaging is opened",
        "• Products purchased during clearance or final-sale promotions",
      ],
    },
    {
      title: "How to request a return",
      content: [
        "To initiate a return, contact us at inquiries@steinheim-eg.com or via WhatsApp at +20 122 399 8124 with your order number and reason for return.",
        "Our team will confirm eligibility and provide return instructions within 1–2 business days.",
      ],
    },
    {
      title: "Return shipping",
      content: [
        "For returns due to a defect or error on our part, Steinheim Egypt will cover the return shipping cost.",
        "For returns due to change of mind, the customer is responsible for return shipping. Products must be shipped in protective packaging to avoid damage in transit.",
      ],
    },
    {
      title: "Exchanges",
      content: [
        "We offer exchanges for different finishes or models, subject to availability. The same 14-day window and condition requirements apply.",
        "If the replacement item has a different price, we will refund or charge the difference accordingly.",
      ],
    },
    {
      title: "Refund process",
      content: [
        "Once we receive and inspect the returned product, we will process your refund within 5–7 business days.",
        "Refunds are issued to the original payment method. Bank processing times may add 3–5 additional business days.",
      ],
    },
    {
      title: "Damaged or defective products",
      content: [
        "If your product arrives damaged or with a manufacturing defect, contact us within 48 hours of delivery with photographs of the damage.",
        "We will arrange a free replacement or full refund at your choice. For warranty-covered defects discovered after installation, please refer to our warranty policy.",
      ],
    },
    {
      title: "Questions",
      content: [
        "For any return or exchange enquiries, contact us at inquiries@steinheim-eg.com or via WhatsApp at +20 122 399 8124.",
      ],
    },
  ];

  return (
    <PageTransition>
      <section className="bg-charcoal pt-[124px]">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
          <div className="py-16 sm:py-20 lg:py-28">
            <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-white/30">
              Policy
            </p>
            <h1 className="mt-5 max-w-2xl font-heading text-[clamp(2.4rem,5vw,4.2rem)] leading-[1.05] text-white">
              Returns &amp; exchanges
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
