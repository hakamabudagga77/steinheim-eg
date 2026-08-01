import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import ProductDetailClient from "@/components/product/ProductDetailClient";
import { getProductBySlug, getSeriesById } from "@/lib/utils";
import { getProductImage } from "@/data/images";
import { getLiveProductData } from "@/lib/shopify-live-data";
import { listApprovedReviewsForProduct } from "@/lib/server/review-store";
import { createLocalizedMetadata, normalizeLocale } from "@/lib/seo";

type ProductPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return { title: "Product not found | Steinheim" };
  const series = getSeriesById(product.series);
  const normalizedLocale = normalizeLocale(locale);
  const title =
    normalizedLocale === "ar"
      ? `${series?.name ?? product.series} ${product.name} | شتاينهايم مصر`
      : `${series?.name ?? product.series} ${product.name} | Steinheim Egypt`;
  const description =
    normalizedLocale === "ar"
      ? `اكتشف ${product.name} من مجموعة ${series?.name ?? product.series}، مع التشطيبات وأرقام الموديلات والأسعار المرجعية والمواصفات التقنية.`
      : `${product.name} from the Steinheim ${series?.name ?? product.series} collection. Explore verified finishes, model numbers, retail-reference prices, and technical specifications.`;
  const baseMetadata = createLocalizedMetadata({
    locale,
    path: `/products/${slug}`,
    title,
    description,
  });

  return {
    ...baseMetadata,
    openGraph: {
      ...baseMetadata.openGraph,
      images: getProductImage(product.slug, product.variants[0].finish)
        ? [getProductImage(product.slug, product.variants[0].finish)!]
        : [],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const series = getSeriesById(product.series);
  const liveData = await getLiveProductData(slug);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://steinheim-eg.com";

  // Approved reviews are already collected and moderated, but they were only
  // ever fetched in the browser — so Google never saw a rating and could not
  // render stars. Resolved here instead, and deliberately non-fatal: the
  // product page must still render if the review store isn't configured.
  let approvedReviews: Awaited<ReturnType<typeof listApprovedReviewsForProduct>> = [];
  try {
    approvedReviews = await listApprovedReviewsForProduct(slug);
  } catch {
    approvedReviews = [];
  }
  const ratingCount = approvedReviews.length;
  const ratingValue =
    ratingCount > 0
      ? Math.round((approvedReviews.reduce((sum, r) => sum + r.rating, 0) / ratingCount) * 10) / 10
      : 0;

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${series?.name ?? product.series} ${product.name}`,
    brand: { "@type": "Brand", name: "Steinheim" },
    // Absolute: schema.org consumers don't resolve root-relative paths.
    image: product.variants
      .map((variant) => getProductImage(product.slug, variant.finish))
      .filter((path): path is string => Boolean(path))
      .map((path) => new URL(path, baseUrl).toString()),
    ...(ratingCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue,
            reviewCount: ratingCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
    offers: product.variants.map((variant) => {
      const live = liveData?.variants.find((v) => v.finish === variant.finish);
      return {
        "@type": "Offer",
        sku: variant.model,
        priceCurrency: "EGP",
        price: live?.price ?? variant.price,
        // url and itemCondition are both required for a valid merchant Offer.
        url: `${baseUrl}/${locale}/products/${product.slug}?finish=${variant.finish}`,
        itemCondition: "https://schema.org/NewCondition",
        availability: live?.inStock === false
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
      };
    }),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${baseUrl}/${locale}` },
      { "@type": "ListItem", position: 2, name: "Collections", item: `${baseUrl}/${locale}/collections` },
      {
        "@type": "ListItem",
        position: 3,
        name: series?.name ?? product.series,
        item: `${baseUrl}/${locale}/collections/${product.series}`,
      },
      { "@type": "ListItem", position: 4, name: product.name },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <ProductDetailClient
        key={slug}
        slug={slug}
        liveData={liveData ? JSON.parse(JSON.stringify(liveData)) : null}
      />
    </>
  );
}
