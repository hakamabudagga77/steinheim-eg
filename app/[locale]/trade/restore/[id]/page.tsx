import { setRequestLocale } from "next-intl/server";
import TradeRestoreClient from "@/components/trade/TradeRestoreClient";

export default async function TradeRestorePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  return <TradeRestoreClient id={id} locale={locale} />;
}
