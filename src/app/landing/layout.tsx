import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/page-meta";

export const metadata: Metadata = buildPageMetadata({
  title: "Indian meal plans for mothers of kids 4–12",
  description:
    "BabyBite writes thirty days of Indian breakfast, snacks, lunch, and dinner for your child’s age and kitchen. Tape the plan to the fridge — never wonder what to cook again.",
  path: "/landing",
});

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
