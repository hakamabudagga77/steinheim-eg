import { setRequestLocale } from "next-intl/server";
import ShopByNeedClient from "@/components/trade/ShopByNeedClient";
import { getStaticPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return getStaticPageMetadata(locale, "/shop-by-need", "shopByNeed");
}

export default async function ShopByNeedPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ShopByNeedClient />;
}
