"use client"

import { AnimatePresence, motion } from "framer-motion"

interface Props {
  value: number
  damageType: "damage" | "heal"
  stepId: string
}

export function DamageNumber({ value, damageType, stepId }: Props) {
  const color = damageType === "heal" ? "text-green-400" : "text-red-400"
  const prefix = damageType === "heal" ? "+" : "-"

  return (
    <AnimatePresence>
      <motion.div
        key={stepId}
        className={`pointer-events-none absolute -top-6 left-1/2 z-30 -translate-x-1/2 text-sm font-bold ${color}`}
        style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}
        initial={{ y: 0, opacity: 1 }}
        animate={{ y: -36, opacity: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {prefix}{value}
      </motion.div>
    </AnimatePresence>
  )
}
