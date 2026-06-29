import { setRequestLocale } from "next-intl/server";
import CollectionsLanding from "@/components/collections/CollectionsLanding";
import PageTransition from "@/components/layout/PageTransition";

export default async function CollectionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <PageTransition>
      <CollectionsLanding />
    </PageTransition>
  );
}
