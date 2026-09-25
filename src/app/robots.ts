import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/page-meta";

export default function robots(): MetadataRoute.Robots {
  const origin = siteOrigin();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/onboarding",
        "/payment",
        "/results",
        "/success",
        "/settings",
        "/preview",
        "/analysis",
        "/legacy/",
      ],
    },
    sitemap: `${origin}/sitemap.xml`,
  };
}
