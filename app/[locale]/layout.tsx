import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import SiteShell from "@/components/layout/SiteShell";
import "../globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Steinheim | Premium German Bathroom Fixtures in Egypt",
  description:
    "Discover Steinheim's premium bathroom mixers, shower systems, and accessories. German-engineered with Sedal cartridges and Neoperl aerators. Available in 6 finishes. Exclusive to Egypt through SIG.",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const messages = await getMessages();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} className={inter.variable}>
      <body className="min-h-screen flex flex-col bg-white text-charcoal antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SiteShell locale={locale}>{children}</SiteShell>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
