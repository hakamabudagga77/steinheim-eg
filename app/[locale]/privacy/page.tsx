import { setRequestLocale } from "next-intl/server";
import PageTransition from "@/components/layout/PageTransition";
import ScrollReveal from "@/components/ui/ScrollReveal";

export const metadata = {
  title: "Privacy Policy | Steinheim Egypt",
  description:
    "How Steinheim Egypt collects, uses, and protects your personal information when you use our website and services.",
};

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sections = [
    {
      title: "Information we collect",
      content: [
        "When you place an order, submit a contact form, or use our trade portal, we collect information necessary to fulfil your request. This may include your name, email address, phone number, delivery address, and company name (for trade accounts).",
        "We also collect non-personal data through cookies and analytics tools, such as pages visited, browser type, and device information, to improve your experience on our website.",
      ],
    },
    {
      title: "How we use your information",
      content: [
        "We use your personal information to:",
        "• Process and deliver your orders",
        "• Respond to enquiries and provide customer support",
        "• Send order confirmations, shipping updates, and delivery notifications",
        "• Process trade account applications and project quotations",
        "• Improve our website, products, and services",
        "We do not sell, rent, or share your personal information with third parties for their own marketing purposes.",
      ],
    },
    {
      title: "Payment security",
      content: [
        "All payments are processed securely through Shopify's payment infrastructure. We do not store your credit card details on our servers.",
        "Shopify's payment processing is PCI DSS compliant, ensuring your financial information is handled with the highest security standards.",
      ],
    },
    {
      title: "Third-party services",
      content: [
        "We use the following third-party services to operate our website:",
        "• Shopify — Order processing and payment handling",
        "• Vercel — Website hosting and content delivery",
        "• WhatsApp Business — Customer communication",
        "These services have their own privacy policies governing how they handle your data.",
      ],
    },
    {
      title: "Cookies",
      content: [
        "Our website uses essential cookies to maintain your shopping cart and session. We may also use analytics cookies to understand how visitors interact with our site.",
        "You can control cookie preferences through your browser settings. Disabling essential cookies may affect the functionality of our website.",
      ],
    },
    {
      title: "Data retention",
      content: [
        "We retain your personal information for as long as necessary to fulfil the purposes described in this policy, including order records for accounting and warranty purposes.",
        "Trade account information is retained for the duration of the business relationship and for a reasonable period thereafter.",
      ],
    },
    {
      title: "Your rights",
      content: [
        "You have the right to:",
        "• Access the personal information we hold about you",
        "• Request correction of inaccurate information",
        "• Request deletion of your personal data, subject to legal retention requirements",
        "• Opt out of marketing communications at any time",
        "To exercise any of these rights, contact us at inquiries@steinheim-eg.com.",
      ],
    },
    {
      title: "Contact",
      content: [
        "For privacy-related enquiries, contact us at inquiries@steinheim-eg.com or via WhatsApp at +20 122 399 8124.",
        "Steinheim Egypt — El Sharbatly International Group, Cairo, Egypt.",
      ],
    },
  ];

  return (
    <PageTransition>
      <section className="bg-charcoal pt-[72px] lg:pt-[80px]">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
          <div className="py-16 sm:py-20 lg:py-28">
            <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-white/30">
              Policy
            </p>
            <h1 className="mt-5 max-w-2xl font-heading text-[clamp(2.4rem,5vw,4.2rem)] leading-[1.05] text-white">
              Privacy policy
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
              Last updated: June 2026. This policy applies to steinheim-eg.com operated by El Sharbatly International Group.
            </p>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
