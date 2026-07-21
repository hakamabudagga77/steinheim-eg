import type { Metadata, Viewport } from "next";
import { Amiri, IBM_Plex_Sans_Arabic, Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { routing } from "@/i18n/routing";
import SiteShell from "@/components/layout/SiteShell";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import WebVitals from "@/components/analytics/WebVitals";
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

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://steinheim-eg.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    // Absolute base for every relative URL in metadata (OG images, canonical,
    // alternates). Without it Next falls back to the deploy host — localhost
    // in local builds — which is exactly what its build warning flags.
    metadataBase: new URL(BASE_URL),
    title: t("title"),
    description: t("description"),
    // hreflang alternates so search engines index each language correctly
    // and never serve the wrong locale to a searcher.
    alternates: {
      canonical: `/${locale}`,
      languages: {
        en: "/en",
        ar: "/ar",
        "x-default": "/en",
      },
    },
    openGraph: {
      type: "website",
      siteName: "Steinheim Egypt",
      locale: locale === "ar" ? "ar_EG" : "en_US",
      title: t("title"),
      description: t("description"),
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

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Steinheim Egypt",
    url: BASE_URL,
    logo: `${BASE_URL}/images/brand/steinheim-logo-black.png`,
    email: "inquiries@steinheim-eg.com",
    areaServed: "EG",
  };

  return (
    <html lang={locale} dir={dir} className={`${inter.variable} ${plexArabic.variable} ${amiri.variable}`}>
      <body className="min-h-screen flex flex-col bg-white text-charcoal antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <GoogleAnalytics />
        <WebVitals />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SiteShell locale={locale}>{children}</SiteShell>
        </NextIntlClientProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
