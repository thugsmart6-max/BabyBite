import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/page-meta";

export const metadata: Metadata = buildPageMetadata({
  title: "Sign in",
  description: "Sign in to BabyBite to open tonight’s meals, your 30-day plan, and fridge PDF.",
  path: "/login",
});

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
