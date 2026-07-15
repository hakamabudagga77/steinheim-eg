"use client";

import Footer from "@/components/layout/Footer";
import { usePathname } from "@/i18n/navigation";

export default function ConditionalFooter() {
  const pathname = usePathname();
  const path = pathname.replace(/^\/(en|ar)(?=\/|$)/, "") || "/";
  const dark = path === "/" || path.startsWith("/projects") || path.startsWith("/3d");

  return <Footer dark={dark} />;
}
