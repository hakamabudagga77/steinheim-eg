import type { MetadataRoute } from "next";

// Emits /manifest.webmanifest; Next injects <link rel="manifest"> automatically,
// so no layout change is needed. Colours are the existing brand tokens from
// app/globals.css (--color-charcoal / --color-white).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Steinheim Egypt — German Bathroom Fixtures",
    short_name: "Steinheim",
    description:
      "Premium German-engineered bathroom mixers, showers, and accessories in Egypt.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#1A1A1A",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
