"use client";

import { PageTransition } from "@/components/motion/page-transition";

export default function RootTemplate({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
