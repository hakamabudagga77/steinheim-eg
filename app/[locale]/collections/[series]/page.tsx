import { getTranslations, setRequestLocale } from "next-intl/server";
import CollectionPageClient from "@/components/collections/CollectionPageClient";
import { getAllFinishes, getProductsBySeries, getSeriesById } from "@/lib/utils";
import { getAllLiveData } from "@/lib/shopify-live-data";
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

  return createLocalizedMetadata({
    locale,
    path: `/collections/${seriesId}`,
    title,
    description,
  });
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

  return (
    <CollectionPageClient
      series={series}
      products={products}
      finishes={finishes}
      liveData={JSON.parse(JSON.stringify(liveData))}
    />
  );
}
