import type { Metadata } from "next";
import { resolvePublicAppUrl } from "@/lib/app-url";

const FALLBACK_ORIGIN = "https://baby-bite.vercel.app";

export function siteOrigin(): string {
  return resolvePublicAppUrl() ?? FALLBACK_ORIGIN;
}

export function canonicalPath(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${siteOrigin()}${normalized}`;
}

type PageMetaInput = {
  title: string;
  description: string;
  path: string;
  noIndex?: boolean;
};

export function buildPageMetadata(input: PageMetaInput): Metadata {
  const { title, description, path, noIndex = false } = input;
  return {
    title,
    description,
    alternates: { canonical: canonicalPath(path) },
    openGraph: {
      title: `${title} | BabyBite`,
      description,
      url: canonicalPath(path),
      siteName: "BabyBite",
      type: "website",
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}
