"use client"

import { AnimatePresence, motion } from "framer-motion"
import { Phase } from "@tcg/shared-types"
import { useCurrentAnimation } from "@/animation/animation-queue-context"
import { phaseBannerVariants } from "@/animation/framer-variants"

interface PhaseConfig {
  label: string
  bg: string
  text: string
  shadow: string
}

const PHASE_CONFIG: Record<Phase, PhaseConfig> = {
  [Phase.MAIN_PHASE]:       { label: "MAIN PHASE",   bg: "bg-neon/20 backdrop-blur-sm",        text: "text-neon",        shadow: "shadow-glow-neon" },
  [Phase.ATTACK_PHASE]:     { label: "ATTACK PHASE", bg: "bg-life-red/20 backdrop-blur-sm",    text: "text-life-red",    shadow: "shadow-glow-red" },
  [Phase.START_TURN]:       { label: "TURN START",   bg: "bg-cyber-sky/15 backdrop-blur-sm",   text: "text-cyber-sky",   shadow: "shadow-[0_0_16px_rgba(64,192,240,0.5)]" },
  [Phase.END_TURN]:         { label: "END TURN",     bg: "bg-cyber-purple/20 backdrop-blur-sm", text: "text-cyber-violet", shadow: "shadow-glow-cyber" },
  [Phase.END_TURN_SELECT]:  { label: "KEEP CARDS",   bg: "bg-neon/15 backdrop-blur-sm",        text: "text-neon",        shadow: "shadow-glow-neon" },
}

export function PhaseBanner() {
  const current = useCurrentAnimation()
  const isActive = current?.kind === "PHASE_BANNER"
  const toPhase = isActive ? (current as { toPhase: Phase }).toPhase : null
  const config = toPhase ? PHASE_CONFIG[toPhase] : null

  return (
    <AnimatePresence>
      {isActive && config && (
        <motion.div
          key={current!.id}
          className="pointer-events-none fixed inset-x-0 top-16 z-40 flex justify-center"
          variants={phaseBannerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div className={`relative overflow-hidden rounded-sm border-[2px] border-rim/80 px-12 py-3 ${config.bg} ${config.shadow}`}>
            <div className="tex-scanline opacity-30" />
            <p className={`relative z-10 font-impact text-3xl uppercase tracking-tight ${config.text}`}>
              {config.label}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
