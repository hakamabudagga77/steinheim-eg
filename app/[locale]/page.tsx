import { setRequestLocale } from "next-intl/server";
import Hero from "@/components/home/Hero";
import CollectionGrid from "@/components/home/CollectionGrid";
import FinishPlanetsSection from "@/components/home/FinishPlanetsSection";
import ShopByCategory from "@/components/home/ShopByCategory";
import CustomerPathways from "@/components/home/CustomerPathways";
import HomeVideoBreak from "@/components/home/HomeVideoBreak";
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
      <Hero />
      <CollectionGrid />
      <FinishPlanetsSection />
      <ShopByCategory />
      <CustomerPathways />
      <HomeVideoBreak />
    </PageTransition>
  );
}
