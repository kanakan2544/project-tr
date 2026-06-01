import type { Variants } from "framer-motion"

export const summonFlyInVariants: Variants = {
  hidden: { opacity: 0, y: -60, scale: 0.7 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 320, damping: 24 },
  },
}

// For my units (bottom) — lunge upward toward opponent
export const unitLungeMyVariants: Variants = {
  alive: { x: 0, y: 0 },
  lunge: {
    x: [0, 8, 0],
    y: [0, -22, 0],
    transition: { duration: 0.2, ease: "easeInOut" },
  },
}

// For opponent units (top) — lunge downward toward me
export const unitLungeOppVariants: Variants = {
  alive: { x: 0, y: 0 },
  lunge: {
    x: [0, 8, 0],
    y: [0, 22, 0],
    transition: { duration: 0.2, ease: "easeInOut" },
  },
}

export const unitImpactVariants: Variants = {
  alive: { x: 0 },
  impact: {
    x: [-7, 7, -5, 5, 0],
    transition: { duration: 0.25, ease: "easeInOut" },
  },
}

export const unitDeathVariants: Variants = {
  alive: { opacity: 1, scale: 1 },
  dead: {
    opacity: 0,
    scale: 0.4,
    rotate: 15,
    transition: { duration: 0.5, ease: "easeIn" },
  },
}

export const damageShakeVariants: Variants = {
  idle: { x: 0 },
  shake: {
    x: [-5, 5, -4, 4, 0],
    transition: { duration: 0.3, ease: "easeInOut" },
  },
}

export const primedGlowVariants: Variants = {
  idle: { filter: "none", scale: 1 },
  alive: { filter: "none", scale: 1 },
  glow: {
    filter: ["none", "drop-shadow(0 0 8px #f4c95d)", "drop-shadow(0 0 14px #f4c95d)", "none"],
    scale: [1, 1.04, 1.04, 1],
    transition: { duration: 0.6, ease: "easeInOut" },
  },
}

export const spellshieldBlockVariants: Variants = {
  idle: { filter: "none", scale: 1 },
  alive: { filter: "none", scale: 1 },
  block: {
    filter: ["none", "drop-shadow(0 0 10px #9c6bff)", "drop-shadow(0 0 16px #9c6bff)", "none"],
    scale: [1, 1.06, 1],
    transition: { duration: 0.4, ease: "easeOut" },
  },
}

export const aceUnlockVariants: Variants = {
  locked: { filter: "none", scale: 1 },
  unlocking: {
    filter: [
      "none",
      "drop-shadow(0 0 12px #f4c95d)",
      "drop-shadow(0 0 20px #f4c95d)",
      "none",
    ],
    scale: [1, 1.08, 1.08, 1],
    transition: { duration: 0.8, ease: "easeInOut" },
  },
}

export const phaseBannerVariants: Variants = {
  hidden: { y: -80, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 400, damping: 30 },
  },
  exit: {
    y: -80,
    opacity: 0,
    transition: { duration: 0.25, ease: "easeIn" },
  },
}

export const turnIndicatorVariants: Variants = {
  hidden: { x: -200, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 350, damping: 28 },
  },
  exit: {
    x: -200,
    opacity: 0,
    transition: { duration: 0.2, ease: "easeIn" },
  },
}

export const gameOverVariants: Variants = {
  hidden: { scale: 0.6, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: "spring", stiffness: 280, damping: 22 },
  },
}

export const feedSlideVariants: Variants = {
  hidden: { x: 200, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 350, damping: 30 },
  },
  exit: {
    x: 200,
    opacity: 0,
    transition: { duration: 0.2, ease: "easeIn" },
  },
}
