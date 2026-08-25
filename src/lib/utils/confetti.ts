"use client";

import confetti from "canvas-confetti";

export function celebrateAchievement(options?: { particleCount?: number }) {
  const count = options?.particleCount ?? 100;

  confetti({
    particleCount: count,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["#f6d326", "#111111", "#ffffff", "#1b3d32"],
  });
}

export function celebrateMilestone() {
  const duration = 2000;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: ["#f6d326", "#111111", "#ffffff"],
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: ["#f6d326", "#1b3d32", "#111111"],
    });

    if (Date.now() < end) requestAnimationFrame(frame);
  };

  frame();
}
