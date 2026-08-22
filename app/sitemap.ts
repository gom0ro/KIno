import type { MetadataRoute } from "next";
import { MOVIES } from "@/lib/movies";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    "",
    "/catalog",
    "/collections",
    "/top",
    "/lists",
    "/login",
    "/register",
  ].map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: path === "" ? 1 : 0.7,
  }));

  const filmPages: MetadataRoute.Sitemap = MOVIES.map((movie) => ({
    url: `${BASE_URL}/film/${movie.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticPages, ...filmPages];
}
