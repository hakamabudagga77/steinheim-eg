import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import PageTransition from "@/components/layout/PageTransition";
import ProductCard from "@/components/product/ProductCard";
import { getCollectionContextImage } from "@/data/images";
import { getProductsBySeries, getSeriesById } from "@/lib/utils";

// Each look pairs a series' real, already-published lifestyle context image
// (see collectionContextImages in data/images.ts) with that series' real
// catalogue products — the leading product matches what the image itself
// depicts (e.g. the Joy image shows a basin setting, so the Joy basin mixer
// leads that look).
const LOOKS = [
  { series: "joy", leadType: "basin-mixer" },
  { series: "up", leadType: "concealed-shower" },
  { series: "art", leadType: "free-standing" },
  { series: "quatro", leadType: "wall-mounted" },
] as const;

export default async function ShopTheLookPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("shopTheLook");
  const tc = await getTranslations("collections");

  const looks = LOOKS.flatMap(({ series, leadType }) => {
    const image = getCollectionContextImage(series);
    const seriesInfo = getSeriesById(series);
    const products = getProductsBySeries(series);
    if (!image || !seriesInfo || products.length === 0) return [];
    const lead = products.find((p) => p.type === leadType) ?? products[0];
    const rest = products.filter((p) => p.slug !== lead.slug).slice(0, 3);
    return [{ series, image, seriesInfo, products: [lead, ...rest] }];
  });

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#ece9e2] px-5 pb-24 pt-32 text-[#0a0a0a] sm:px-8 lg:px-16 lg:pt-40">
        <div className="mx-auto max-w-[1780px]">
          <p className="text-[12px] text-black/40">
            <Link href="/" className="transition hover:text-black">
              {t("breadcrumb.home")}
            </Link>
            {" / "}
            <span className="text-black/60">{t("breadcrumb.shopTheLook")}</span>
          </p>

          <div className="mt-4">
            <p className="text-[12px] uppercase tracking-[0.34em] text-black/40">{t("eyebrow")}</p>
            <h1 className="mt-4 max-w-3xl font-heading text-[clamp(2.6rem,6vw,5.4rem)] font-normal leading-[0.95] tracking-[-0.05em]">
              {t("heading")}
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-[1.75] text-black/55">{t("description")}</p>
          </div>

          <div className="mt-16 space-y-20 lg:space-y-28">
            {looks.map(({ series, image, seriesInfo, products }) => (
              <section key={series} className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
                <div className="relative aspect-[4/5] overflow-hidden rounded-[8px] lg:aspect-auto">
                  <Image
                    src={image}
                    alt={`${seriesInfo.name} collection in a bathroom setting`}
                    fill
                    quality={90}
                    sizes="(max-width: 1024px) 100vw, 55vw"
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-black/35" style={{ fontStyle: "italic" }}>
                    {seriesInfo.name}
                  </p>
                  <h2 className="mt-2 font-heading text-[clamp(1.8rem,3vw,2.6rem)] font-normal leading-[1.05] tracking-[-0.03em]">
                    {tc(`${series}.description`)}
                  </h2>
                  <Link
                    href={`/collections/${series}`}
                    className="mt-4 inline-flex text-[13px] text-black/50 underline decoration-black/20 hover:text-black"
                  >
                    {t("viewCollection")}
                  </Link>
                  <div className="mt-8 grid grid-cols-2 gap-5">
                    {products.map((product) => (
                      <ProductCard key={product.slug} product={product} />
                    ))}
                  </div>
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
