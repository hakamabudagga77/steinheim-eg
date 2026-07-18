import type { Metadata, Viewport } from "next";
import { Amiri, IBM_Plex_Sans_Arabic, Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import SiteShell from "@/components/layout/SiteShell";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import "../globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-inter",
  display: "swap",
});

// Arabic companions to the Latin pair: IBM Plex Sans Arabic mirrors Inter's
// neutral clarity for body text, Amiri mirrors Georgia's serif elegance for
// headings. Font stacks resolve per-glyph, so Latin text is unaffected.
const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500"],
  variable: "--font-arabic-body",
  display: "swap",
});

const amiri = Amiri({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-arabic-heading",
  display: "swap",
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    title: t("title"),
    description: t("description"),
    // hreflang alternates so search engines index each language correctly
    // and never serve the wrong locale to a searcher.
    alternates: {
      languages: {
        en: "/en",
        ar: "/ar",
        "x-default": "/en",
      },
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
    <html lang={locale} dir={dir} className={`${inter.variable} ${plexArabic.variable} ${amiri.variable}`}>
      <body className="min-h-screen flex flex-col bg-white text-charcoal antialiased">
        <GoogleAnalytics />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SiteShell locale={locale}>{children}</SiteShell>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
