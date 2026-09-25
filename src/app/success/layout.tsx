import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/page-meta";

export const metadata: Metadata = buildPageMetadata({
  title: "You’re in",
  description: "Payment confirmed. Open your BabyBite meal plan and fridge PDF.",
  path: "/success",
  noIndex: true,
});

export default function SuccessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
