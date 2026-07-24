import type { ReactNode } from "react";
import { getStaticPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return getStaticPageMetadata(locale, "/wishlist", "wishlist", { index: false });
}

export default function WishlistLayout({ children }: { children: ReactNode }) {
  return children;
}
