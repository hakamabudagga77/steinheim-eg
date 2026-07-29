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
  return getStaticPageMetadata(locale, "/assistant", "assistant", { index: false });
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
