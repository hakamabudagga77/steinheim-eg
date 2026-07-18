import { setRequestLocale } from "next-intl/server";
import GessiInspiredHome from "@/components/home/GessiInspiredHome";
import PageTransition from "@/components/layout/PageTransition";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <PageTransition>
      <GessiInspiredHome />
    </PageTransition>
  );
}
