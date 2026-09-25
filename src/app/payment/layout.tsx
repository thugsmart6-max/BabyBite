import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/page-meta";

export const metadata: Metadata = buildPageMetadata({
  title: "Unlock 30 days of meals",
  description:
    "Pay once for thirty days of rotated Indian meals, portions for ages 4–12, and a printable fridge PDF.",
  path: "/payment",
  noIndex: true,
});

export default function PaymentLayout({ children }: { children: React.ReactNode }) {
  return children;
}
