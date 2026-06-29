import { setRequestLocale } from "next-intl/server";
import PageTransition from "@/components/layout/PageTransition";
import SteinheimAssistant from "@/components/assistant/SteinheimAssistant";

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
