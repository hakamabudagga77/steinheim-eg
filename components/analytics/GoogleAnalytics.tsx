import Script from "next/script";

export default function GoogleAnalytics() {
  const gaId = process.env.NEXT_PUBLIC_GA4_ID;
  if (!gaId) return null;
  const productionHostname = new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://steinheim-eg.com"
  ).hostname.replace(/^www\./, "");
  // Optional: when the store domain is exposed, GA4 decorates anchor clicks
  // and form submits to it with the `_gl` linker parameter so the Shopify
  // checkout continues the same GA4 session. Programmatic navigations are not
  // decorated by gtag, so campaign attribution to Shopify is handled
  // separately and reliably in lib/attribution.ts.
  const storeDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  const linkerDomains = storeDomain ? [productionHostname, storeDomain] : null;
  const analyticsConfig = JSON.stringify({ gaId, productionHostname, linkerDomains });

  return (
    <Script id="ga4-init" strategy="afterInteractive">
      {`
        (() => {
          const config = ${analyticsConfig};
          const hostname = window.location.hostname.replace(/^www\\./, '');
          if (hostname !== config.productionHostname) return;

          window.dataLayer = window.dataLayer || [];
          window.gtag = function gtag(){window.dataLayer.push(arguments);}
          window.gtag('js', new Date());
          window.gtag('config', config.gaId, config.linkerDomains
            ? { linker: { domains: config.linkerDomains } }
            : {});

          const script = document.createElement('script');
          script.async = true;
          script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(config.gaId);
          document.head.appendChild(script);
        })();
      `}
    </Script>
  );
}
