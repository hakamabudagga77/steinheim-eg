import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    qualities: [75, 82, 85, 90, 94, 100],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "steinheim-eg.com",
        pathname: "/cdn/shop/files/**",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
