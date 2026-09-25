import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/page-meta";

export const metadata: Metadata = buildPageMetadata({
  title: "Create account",
  description:
    "Create a BabyBite account in minutes. Tell us your child’s age and kitchen, then get Indian meals written for the table.",
  path: "/signup",
});

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
