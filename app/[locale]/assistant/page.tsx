import { setRequestLocale } from "next-intl/server";
import PageTransition from "@/components/layout/PageTransition";
import SteinheimAssistant from "@/components/assistant/SteinheimAssistant";
import { getStaticPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Indexable: the concierge is a real, catalogue-grounded tool with its own
  // bilingual SEO copy, and it is now linked from the main menu. It was
  // noindex while it was unreachable, which left the copy doing nothing.
  return getStaticPageMetadata(locale, "/assistant", "assistant");
}

export default async function AssistantPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <PageTransition>
      <SteinheimAssistant locale={locale} />
    </PageTransition>
  );
}
