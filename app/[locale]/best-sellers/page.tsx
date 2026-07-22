import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import PageTransition from "@/components/layout/PageTransition";
import ProductCard from "@/components/product/ProductCard";
import { computeBestSellers } from "@/lib/best-sellers";
import { fetchOrders } from "@/lib/shopify-client";

export const revalidate = 60;

async function getBestSellers() {
  try {
    const orders = await fetchOrders();
    return computeBestSellers(orders, 12);
  } catch {
    // Shopify not configured, or the request failed — the page still
    // renders, just without a ranked list, rather than surfacing a raw
    // upstream error to shoppers.
    return [];
  }
}

export default async function BestSellersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("bestSellers");
  const bestSellers = await getBestSellers();

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#ece9e2] px-5 pb-24 pt-32 text-[#0a0a0a] sm:px-8 lg:px-16 lg:pt-40">
        <div className="mx-auto max-w-[1780px]">
          <p className="text-[12px] text-black/40">
            <Link href="/" className="transition hover:text-black">
              {t("breadcrumb.home")}
            </Link>
            {" / "}
            <span className="text-black/60">{t("breadcrumb.bestSellers")}</span>
          </p>

          <div className="mt-4">
            <p className="text-[12px] uppercase tracking-[0.34em] text-black/40">{t("eyebrow")}</p>
            <h1 className="mt-4 max-w-3xl font-heading text-[clamp(2.6rem,6vw,5.4rem)] font-normal leading-[0.95] tracking-[-0.05em]">
              {t("heading")}
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-[1.75] text-black/55">{t("description")}</p>
          </div>

          {bestSellers.length === 0 ? (
            <p className="mt-16 text-[14px] text-black/45">{t("empty")}</p>
          ) : (
            <div className="mt-12 grid grid-cols-2 gap-10 md:gap-12 lg:grid-cols-3 lg:gap-y-20">
              {bestSellers.map(({ product }) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
