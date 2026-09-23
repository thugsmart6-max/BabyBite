"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

export type MotionTier = "mobile" | "tablet" | "desktop" | "tv";

function readTier(width: number): MotionTier {
  if (width >= 2560) return "tv";
  if (width >= 1024) return "desktop";
  if (width >= 768) return "tablet";
  return "mobile";
}

export function useMotionCapabilities() {
  const reducedMotion = useReducedMotion();
  const [tier, setTier] = useState<MotionTier>("desktop");
  const [finePointer, setFinePointer] = useState(true);

  useEffect(() => {
    const update = () => setTier(readTier(window.innerWidth));
    update();
    window.addEventListener("resize", update, { passive: true });
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    const update = () => setFinePointer(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const motionAllowed = !reducedMotion;
  const isDesktop = tier === "desktop" || tier === "tv";
  const enableCursor = motionAllowed && finePointer && isDesktop && tier !== "tv";
  const enableMagnetic = motionAllowed && finePointer && isDesktop;
  const enableParallax = motionAllowed && finePointer && isDesktop;
  const enableScrollReveal = motionAllowed;
  const enablePageTransition = motionAllowed;
  const enableLivingArt = motionAllowed && tier !== "tv";

  return {
    reducedMotion: Boolean(reducedMotion),
    tier,
    finePointer,
    motionAllowed,
    enableCursor,
    enableMagnetic,
    enableParallax,
    enableScrollReveal,
    enablePageTransition,
    enableLivingArt,
  };
}
