import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/page-meta";

export const metadata: Metadata = buildPageMetadata({
  title: "Your meal plan",
  description: "Tonight through thirty days: Indian meals for your child, with swaps and a fridge-ready PDF.",
  path: "/results",
  noIndex: true,
});

export default function ResultsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
