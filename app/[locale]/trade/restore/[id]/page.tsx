import { setRequestLocale } from "next-intl/server";
import TradeRestoreClient from "@/components/trade/TradeRestoreClient";
import { getStaticPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  return getStaticPageMetadata(locale, `/trade/restore/${id}`, "tradeRestore", { index: false });
}

export default async function TradeRestorePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  return <TradeRestoreClient id={id} locale={locale} />;
}
