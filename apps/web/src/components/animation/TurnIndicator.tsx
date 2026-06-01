"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useCurrentAnimation } from "@/animation/animation-queue-context"
import { turnIndicatorVariants } from "@/animation/framer-variants"

interface Props {
  myPlayerId: string
}

export function TurnIndicator({ myPlayerId }: Props) {
  const current = useCurrentAnimation()
  const isActive = current?.kind === "TURN_INDICATOR"
  const isMyTurn = isActive && (current as { activePlayer: string }).activePlayer === myPlayerId

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          key={current!.id}
          className="pointer-events-none fixed bottom-24 left-6 z-40"
          variants={turnIndicatorVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div
            className={[
              "rounded-lg border-2 px-5 py-2.5",
              isMyTurn
                ? "border-neon bg-panel/90 text-neon"
                : "border-rim/80 bg-panel/80 text-text-muted",
            ].join(" ")}
          >
            <p className="text-sm font-bold tracking-wide">
              {isMyTurn ? "Your Turn" : "Opponent's Turn"}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
