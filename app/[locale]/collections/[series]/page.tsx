import { getTranslations, setRequestLocale } from "next-intl/server";
import CollectionPageClient from "@/components/collections/CollectionPageClient";
import { getAllFinishes, getProductsBySeries, getSeriesById } from "@/lib/utils";
import { getAllLiveData } from "@/lib/shopify-live-data";

type CollectionPageProps = {
  params: Promise<{ locale: string; series: string }>;
};

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
