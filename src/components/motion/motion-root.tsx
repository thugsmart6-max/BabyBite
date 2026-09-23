"use client";

import type { ReactNode } from "react";
import { CursorFollower } from "@/components/motion/cursor-follower";
import { MotionEnhancer } from "@/components/motion/motion-enhancer";

export function MotionRoot({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <CursorFollower />
      <MotionEnhancer />
    </>
  );
}
