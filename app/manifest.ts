import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CalStory — Calorie, Macro & Workout Tracker",
    short_name: "CalStory",
    description:
      "Free calorie, macro and workout tracker with an AI food logger.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "var(--color-primary)",
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
