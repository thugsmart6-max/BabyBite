"use client";

import { useEffect, useRef } from "react";
import { useMotionCapabilities } from "@/lib/motion/use-motion-capabilities";

type HoverKind = "default" | "button" | "card" | "art";

function resolveHoverKind(target: Element | null): HoverKind {
  if (!target) return "default";
  if (target.closest(".bb-cta, .os-box-lunch-confirm, [data-slot='button'], button.bb-cta, a.bb-cta")) {
    return "button";
  }
  if (
    target.closest(
      ".os-pack:not(.is-static), .os-compare-card, .os-box-lunch-option, .bb-course, .os-step, .os-box-lunch-current-card",
    )
  ) {
    return "card";
  }
  if (target.closest(".os-site-art, .bb-parallax-art, .os-box-lunch-art")) {
    return "art";
  }
  return "default";
}

export function CursorFollower() {
  const { enableCursor } = useMotionCapabilities();
  const dotRef = useRef<HTMLDivElement>(null);
  const target = useRef({ x: -100, y: -100, scale: 1, opacity: 0 });
  const current = useRef({ x: -100, y: -100, scale: 1, opacity: 0 });
  const raf = useRef<number>(0);

  useEffect(() => {
    if (!enableCursor) return undefined;

    const onMove = (event: MouseEvent) => {
      target.current.x = event.clientX;
      target.current.y = event.clientY;
      target.current.opacity = 0.42;
      const kind = resolveHoverKind(document.elementFromPoint(event.clientX, event.clientY));
      target.current.scale = kind === "button" ? 1.85 : kind === "card" ? 1.5 : kind === "art" ? 1.3 : 1;
    };

    const onLeave = () => {
      target.current.opacity = 0;
    };

    document.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);

    const tick = () => {
      const el = dotRef.current;
      if (el) {
        current.current.x += (target.current.x - current.current.x) * 0.18;
        current.current.y += (target.current.y - current.current.y) * 0.18;
        current.current.scale += (target.current.scale - current.current.scale) * 0.2;
        current.current.opacity += (target.current.opacity - current.current.opacity) * 0.22;
        el.style.transform = `translate3d(${current.current.x}px, ${current.current.y}px, 0) translate(-50%, -50%) scale(${current.current.scale})`;
        el.style.opacity = String(current.current.opacity);
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf.current);
    };
  }, [enableCursor]);

  if (!enableCursor) return null;

  return <div ref={dotRef} className="bb-cursor-follower" aria-hidden />;
}
