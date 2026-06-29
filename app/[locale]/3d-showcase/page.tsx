import { setRequestLocale } from "next-intl/server";
import ProductModelLab from "@/components/three/ProductModelLab";

export default async function ThreeDShowcasePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ProductModelLab />;
}
