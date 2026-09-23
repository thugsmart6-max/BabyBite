/** BabyBite motion language — warm, subtle, GPU-friendly. */
export const motionEase = [0.22, 1, 0.36, 1] as const;

export const motionDurations = {
  fast: 0.2,
  micro: 0.22,
  hover: 0.25,
  reveal: 0.6,
  page: 0.32,
  hero: 0.55,
  lunchSwap: 0.45,
  draw: 1,
} as const;

export const motionStagger = {
  card: 0.1,
  section: 0.08,
} as const;

export const motionDistances = {
  revealY: 20,
  heroY: 16,
  pageInY: 8,
  pageOutY: 4,
  magneticMax: 5,
  cardMagneticMax: 3,
  parallaxMax: 8,
} as const;

export const heroSequence = {
  background: 0,
  illustration: 0.15,
  headline: 0.25,
  description: 0.35,
  cta: 0.45,
} as const;
