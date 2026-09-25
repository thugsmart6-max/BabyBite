import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/page-meta";

const PUBLIC_PATHS = ["/landing", "/signup", "/login"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteOrigin();
  const now = new Date();
  return PUBLIC_PATHS.map((path) => ({
    url: `${origin}${path}`,
    lastModified: now,
    changeFrequency: path === "/landing" ? "weekly" : "monthly",
    priority: path === "/landing" ? 1 : 0.6,
  }));
}
