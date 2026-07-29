import type { ReactNode } from "react";
import { getStaticPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return getStaticPageMetadata(locale, "/products", "products");
}

export default function ProductsLayout({ children }: { children: ReactNode }) {
  return children;
}
