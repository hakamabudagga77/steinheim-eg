import { setRequestLocale } from "next-intl/server";
import ProductModelLab from "@/components/three/ProductModelLab";
import { getStaticPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return getStaticPageMetadata(locale, "/3d-showcase", "threeDShowcase", { index: false });
}

export default async function ThreeDShowcasePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ProductModelLab />;
}
