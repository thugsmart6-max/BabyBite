"use client";

import { useEffect } from "react";
import { motionDistances } from "@/lib/motion/tokens";
import { useMotionCapabilities } from "@/lib/motion/use-motion-capabilities";

const MAGNETIC_SELECTORS =
  ".bb-cta, a.bb-cta, button.bb-cta, .os-box-lunch-confirm, [data-slot='button']:not(:disabled)";

const CARD_SELECTORS =
  ".os-pack:not(.is-static), .os-compare-card, .os-box-lunch-option, .os-box-lunch-current-card";

const ART_SELECTORS = ".bb-parallax-art, .os-site-art.is-photo, .os-site-art.is-bond";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function bindMagnetic(el: HTMLElement, max: number, strength: number) {
  const reset = () => {
    el.style.setProperty("--bb-mag-x", "0px");
    el.style.setProperty("--bb-mag-y", "0px");
  };

  const onMove = (event: MouseEvent) => {
    const rect = el.getBoundingClientRect();
    const x = event.clientX - (rect.left + rect.width / 2);
    const y = event.clientY - (rect.top + rect.height / 2);
    el.style.setProperty("--bb-mag-x", `${clamp(x * strength, -max, max)}px`);
    el.style.setProperty("--bb-mag-y", `${clamp(y * strength, -max, max)}px`);
  };

  el.classList.add("bb-motion-magnetic");
  el.addEventListener("mousemove", onMove);
  el.addEventListener("mouseleave", reset);
  return () => {
    el.removeEventListener("mousemove", onMove);
    el.removeEventListener("mouseleave", reset);
    el.classList.remove("bb-motion-magnetic");
    reset();
  };
}

function bindCardTilt(el: HTMLElement) {
  const max = motionDistances.cardMagneticMax;
  const onMove = (event: MouseEvent) => {
    const rect = el.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    el.style.setProperty("--bb-card-x", `${clamp(x * max, -max, max)}px`);
    el.style.setProperty("--bb-card-y", `${clamp(y * -max, -max, max)}px`);
  };
  const reset = () => {
    el.style.setProperty("--bb-card-x", "0px");
    el.style.setProperty("--bb-card-y", "0px");
  };
  el.classList.add("bb-motion-card");
  el.addEventListener("mousemove", onMove);
  el.addEventListener("mouseleave", reset);
  return () => {
    el.removeEventListener("mousemove", onMove);
    el.removeEventListener("mouseleave", reset);
    el.classList.remove("bb-motion-card");
    reset();
  };
}

function bindParallax(el: HTMLElement, depth: number) {
  const max = depth;
  const onMove = (event: MouseEvent) => {
    const rect = el.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    el.style.setProperty("--bb-parallax-x", `${clamp(x * max, -max, max)}px`);
    el.style.setProperty("--bb-parallax-y", `${clamp(y * max, -max, max)}px`);
  };
  const reset = () => {
    el.style.setProperty("--bb-parallax-x", "0px");
    el.style.setProperty("--bb-parallax-y", "0px");
  };
  el.classList.add("bb-motion-parallax");
  el.addEventListener("mousemove", onMove);
  el.addEventListener("mouseleave", reset);
  return () => {
    el.removeEventListener("mousemove", onMove);
    el.removeEventListener("mouseleave", reset);
    el.classList.remove("bb-motion-parallax");
    reset();
  };
}

export function MotionEnhancer() {
  const { enableMagnetic, enableParallax } = useMotionCapabilities();

  useEffect(() => {
    if (!enableMagnetic && !enableParallax) return undefined;

    const cleanups: (() => void)[] = [];

    const scan = () => {
      cleanups.forEach((fn) => fn());
      cleanups.length = 0;

      if (enableMagnetic) {
        document.querySelectorAll<HTMLElement>(MAGNETIC_SELECTORS).forEach((el) => {
          if (el.matches(":disabled") || el.getAttribute("aria-disabled") === "true") return;
          cleanups.push(bindMagnetic(el, motionDistances.magneticMax, 0.14));
        });
        document.querySelectorAll<HTMLElement>(CARD_SELECTORS).forEach((el) => {
          cleanups.push(bindCardTilt(el));
        });
      }

      if (enableParallax) {
        document.querySelectorAll<HTMLElement>(ART_SELECTORS).forEach((el) => {
          const depth = el.classList.contains("os-site-art") && el.classList.contains("is-photo") ? 4 : 3;
          cleanups.push(bindParallax(el, depth));
        });
      }
    };

    scan();
    let debounce: ReturnType<typeof setTimeout> | undefined;
    const observer = new MutationObserver(() => {
      clearTimeout(debounce);
      debounce = setTimeout(scan, 150);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      cleanups.forEach((fn) => fn());
    };
  }, [enableMagnetic, enableParallax]);

  return null;
}
