import Script from "next/script";

export default function GoogleAnalytics() {
  const gaId = process.env.NEXT_PUBLIC_GA4_ID;
  if (!gaId) return null;
  const productionHostname = new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://steinheim-eg.com"
  ).hostname.replace(/^www\./, "");
  const analyticsConfig = JSON.stringify({ gaId, productionHostname });

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
          window.gtag('config', config.gaId);

          const script = document.createElement('script');
          script.async = true;
          script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(config.gaId);
          document.head.appendChild(script);
        })();
      `}
    </Script>
  );
}
