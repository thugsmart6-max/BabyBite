"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { motionDurations, motionEase, motionDistances, motionStagger } from "@/lib/motion/tokens";
import { useMotionCapabilities } from "@/lib/motion/use-motion-capabilities";
import { cn } from "@/lib/utils";

export function ScrollReveal({
  children,
  className,
  delay = 0,
  as = "div",
  id,
  "aria-label": ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "article";
  id?: string;
  "aria-label"?: string;
}) {
  const reduced = useReducedMotion();
  const { enableScrollReveal } = useMotionCapabilities();
  const Component =
    as === "section" ? motion.section : as === "article" ? motion.article : motion.div;

  if (!enableScrollReveal || reduced) {
    const Tag = as;
    return (
      <Tag id={id} aria-label={ariaLabel} className={className}>
        {children}
      </Tag>
    );
  }

  return (
    <Component
      id={id}
      aria-label={ariaLabel}
      className={cn("bb-scroll-reveal", className)}
      initial={{ opacity: 0, y: motionDistances.revealY }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15, margin: "0px 0px -8% 0px" }}
      transition={{ duration: motionDurations.reveal, delay, ease: motionEase }}
    >
      {children}
    </Component>
  );
}

export function ScrollRevealStagger({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const { enableScrollReveal } = useMotionCapabilities();

  if (!enableScrollReveal || reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.12 }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: motionStagger.card } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function ScrollRevealItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const { enableScrollReveal } = useMotionCapabilities();

  if (!enableScrollReveal || reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: motionDistances.revealY },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: motionDurations.reveal, ease: motionEase },
        },
      }}
    >
      {children}
    </motion.div>
  );
}
