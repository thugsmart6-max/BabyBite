"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { heroSequence, motionDurations, motionEase, motionDistances } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

const steps = {
  background: heroSequence.background,
  illustration: heroSequence.illustration,
  headline: heroSequence.headline,
  description: heroSequence.description,
  cta: heroSequence.cta,
} as const;

export function HeroStage({
  step,
  children,
  className,
}: {
  step: keyof typeof steps;
  children: ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const delay = steps[step];

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={cn("bb-hero-stage", className)}
      initial={{ opacity: 0, y: motionDistances.heroY }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: motionDurations.hero,
        delay,
        ease: motionEase,
      }}
    >
      {children}
    </motion.div>
  );
}
