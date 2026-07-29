import { setRequestLocale } from "next-intl/server";
import CollectionsLanding from "@/components/collections/CollectionsLanding";
import PageTransition from "@/components/layout/PageTransition";
import { getStaticPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return getStaticPageMetadata(locale, "/collections", "collections");
}

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
