import { getTranslations, setRequestLocale } from "next-intl/server";
import CollectionPageClient from "@/components/collections/CollectionPageClient";
import { getAllFinishes, getProductsBySeries, getSeriesById } from "@/lib/utils";
import { getAllLiveData } from "@/lib/shopify-live-data";
import { collectionBanners, getProductDefaultImage } from "@/data/images";
import { createLocalizedMetadata, normalizeLocale } from "@/lib/seo";

type CollectionPageProps = {
  params: Promise<{ locale: string; series: string }>;
};

export async function generateMetadata({ params }: CollectionPageProps) {
  const { locale, series: seriesId } = await params;
  const series = getSeriesById(seriesId);
  if (!series) return {};

  const normalizedLocale = normalizeLocale(locale);
  const title =
    normalizedLocale === "ar"
      ? `مجموعة ${series.name} للحمامات | شتاينهايم مصر`
      : `${series.name} Bathroom Collection | Steinheim Egypt`;
  const description =
    normalizedLocale === "ar"
      ? `استكشف منتجات وتشطيبات مجموعة ${series.name} المتناسقة من شتاينهايم، مع المواصفات والأسعار المرجعية المتاحة في مصر.`
      : series.description;

  const baseMetadata = createLocalizedMetadata({
    locale,
    path: `/collections/${seriesId}`,
    title,
    description,
  });
  const banner = collectionBanners[seriesId];

  return {
    ...baseMetadata,
    openGraph: {
      ...baseMetadata.openGraph,
      ...(banner ? { images: [{ url: banner, width: 1200, height: 630, alt: title }] } : {}),
    },
    twitter: {
      ...baseMetadata.twitter,
      ...(banner ? { images: [banner] } : {}),
    },
  };
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { locale, series: seriesId } = await params;
  setRequestLocale(locale);

  const series = getSeriesById(seriesId);
  if (!series) {
    const t = await getTranslations("collectionPage");
    return (
      <div className="flex min-h-screen items-center justify-center pt-20 text-sm text-black/40">
        {t("notFound")}
      </div>
    );
  }

  const products = getProductsBySeries(seriesId);
  const finishes = getAllFinishes().filter((finish) => series.finishes.includes(finish.id));
  const liveDataMap = await getAllLiveData();
  const liveData = Object.fromEntries(
    Array.from(liveDataMap.entries()).map(([slug, data]) => [slug, { variants: data.variants }])
  );
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://steinheim-eg.com";

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: series.name,
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: product.name,
      url: `${baseUrl}/${locale}/products/${product.slug}`,
      image: getProductDefaultImage(product.slug)
        ? new URL(getProductDefaultImage(product.slug)!, baseUrl).toString()
        : undefined,
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${baseUrl}/${locale}` },
      { "@type": "ListItem", position: 2, name: "Collections", item: `${baseUrl}/${locale}/collections` },
      { "@type": "ListItem", position: 3, name: series.name, item: `${baseUrl}/${locale}/collections/${series.id}` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <CollectionPageClient
        series={series}
        products={products}
        finishes={finishes}
        liveData={JSON.parse(JSON.stringify(liveData))}
      />
    </>
  );
}
