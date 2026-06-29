import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import ProductDetailClient from "@/components/product/ProductDetailClient";
import { getProductBySlug, getSeriesById } from "@/lib/utils";
import { getProductImage } from "@/data/images";
import { getLiveProductData } from "@/lib/shopify-live-data";

type ProductPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return { title: "Product not found | Steinheim" };
  const series = getSeriesById(product.series);
  return {
    title: `${series?.name ?? product.series} ${product.name} | Steinheim Egypt`,
    description: `${product.name} from the Steinheim ${series?.name ?? product.series} collection. Explore verified finishes, model numbers, retail-reference prices, and technical specifications.`,
    openGraph: {
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

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${series?.name ?? product.series} ${product.name}`,
    brand: { "@type": "Brand", name: "Steinheim" },
    image: product.variants
      .map((variant) => getProductImage(product.slug, variant.finish))
      .filter(Boolean),
    offers: product.variants.map((variant) => {
      const live = liveData?.variants.find((v) => v.finish === variant.finish);
      return {
        "@type": "Offer",
        sku: variant.model,
        priceCurrency: "EGP",
        price: live?.price ?? variant.price,
        availability: live?.inStock === false
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
      };
    }),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <ProductDetailClient
        key={slug}
        slug={slug}
        liveData={liveData ? JSON.parse(JSON.stringify(liveData)) : null}
      />
    </>
  );
}
