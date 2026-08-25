import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ФИЛЬМИК — смотреть фильмы онлайн",
    short_name: "ФИЛЬМИК",
    description:
      "Онлайн-кинотеатр: популярные фильмы, новинки и рекомендации.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0b0f",
    theme_color: "#0a0b0f",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
