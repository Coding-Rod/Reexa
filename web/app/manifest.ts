import type { MetadataRoute } from "next";

// Installable on phones and desktops (PWA): the first step toward the mobile app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Reexa",
    short_name: "Reexa",
    description: "Your course slides as cited AI lecture videos, notes and checks that find what you misunderstood.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f4ee",
    theme_color: "#1f4e79",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
