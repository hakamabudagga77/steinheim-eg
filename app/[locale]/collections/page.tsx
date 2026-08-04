import { setRequestLocale } from "next-intl/server";
import CollectionsLanding from "@/components/collections/CollectionsLanding";
import PageTransition from "@/components/layout/PageTransition";
import { getAllSeries } from "@/lib/utils";
import { collectionLandingImages } from "@/data/images";
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
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://steinheim-eg.com";

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Steinheim Bathroom Collections",
    itemListElement: getAllSeries().map((series, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: series.name,
      url: `${baseUrl}/${locale}/collections/${series.id}`,
      image: collectionLandingImages[series.id]
        ? new URL(collectionLandingImages[series.id], baseUrl).toString()
        : undefined,
    })),
  };

  return (
    <PageTransition>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      <CollectionsLanding />
    </PageTransition>
  );
}
