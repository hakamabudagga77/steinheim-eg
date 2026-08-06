import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Steinheim Egypt — German Bathroom Engineering",
    short_name: "Steinheim",
    description:
      "German-engineered bathroom systems, coordinated collections, and premium finishes across Egypt.",
    start_url: "/en",
    scope: "/",
    display: "standalone",
    background_color: "#ece9e2",
    theme_color: "#0a0a0a",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
