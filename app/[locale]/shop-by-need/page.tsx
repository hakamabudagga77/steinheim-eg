import { setRequestLocale } from "next-intl/server";
import ShopByNeedClient from "@/components/trade/ShopByNeedClient";

export default async function ShopByNeedPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ShopByNeedClient />;
}
