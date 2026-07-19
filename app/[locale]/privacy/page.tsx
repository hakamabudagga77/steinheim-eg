import { getTranslations, setRequestLocale } from "next-intl/server";
import PageTransition from "@/components/layout/PageTransition";
import ScrollReveal from "@/components/ui/ScrollReveal";

export const metadata = {
  title: "Privacy Policy | Steinheim Egypt",
  description:
    "How Steinheim Egypt collects, uses, and protects your personal information when you use our website and services.",
};

type ContentBlock = { type: "p"; text: string } | { type: "ul"; items: string[] };

function groupContentBlocks(content: string[]): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  for (const item of content) {
    if (item.startsWith("• ")) {
      const last = blocks[blocks.length - 1];
      if (last?.type === "ul") {
        last.items.push(item.slice(2));
      } else {
        blocks.push({ type: "ul", items: [item.slice(2)] });
      }
    } else {
      blocks.push({ type: "p", text: item });
    }
  }
  return blocks;
}

const sectionKeys = [
  "informationWeCollect",
  "howWeUse",
  "paymentSecurity",
  "thirdParty",
  "cookies",
  "dataRetention",
  "yourRights",
  "contact",
] as const;

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("privacyPage");
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
                  {groupContentBlocks(section.content).map((block, j) =>
                    block.type === "p" ? (
                      <p
                        key={`${section.key}-p-${j}`}
                        className="text-[14px] leading-[1.8] text-warm-gray sm:text-[15px]"
                      >
                        {block.text}
                      </p>
                    ) : (
                      <ul
                        key={`${section.key}-ul-${j}`}
                        className="list-disc space-y-1.5 ps-5 text-[14px] leading-[1.8] text-warm-gray sm:text-[15px]"
                      >
                        {block.items.map((item, k) => (
                          <li key={`${section.key}-li-${j}-${k}`}>{item}</li>
                        ))}
                      </ul>
                    )
                  )}
                </div>
              </div>
            </ScrollReveal>
          ))}

          <div className="mt-16 border-t border-charcoal/8 pt-8">
            <p className="text-[11px] text-warm-gray/50">
              {t("lastUpdated")}
            </p>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
