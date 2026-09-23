"use client";

import { motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { motionDurations, motionEase, motionDistances } from "@/lib/motion/tokens";
import { useMotionCapabilities } from "@/lib/motion/use-motion-capabilities";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const { enablePageTransition, tier } = useMotionCapabilities();

  if (reduced || !enablePageTransition) {
    return <>{children}</>;
  }

  const duration = tier === "tv" ? motionDurations.page * 1.15 : motionDurations.page;

  return (
    <motion.div
      key={pathname}
      className="bb-page-transition"
      initial={{ opacity: 0, y: motionDistances.pageInY }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, ease: motionEase }}
    >
      {children}
    </motion.div>
  );
}
