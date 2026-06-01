"use client"

import { useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import Link from "next/link"
import { audioSystem } from "@/audio/audio-system"
import { gameOverVariants } from "@/animation/framer-variants"

interface Props {
  winner: string | null
  isDraw: boolean
  myPlayerId: string
}

export function GameOverCelebration({ winner, isDraw, myPlayerId }: Props) {
  const isVisible = !!winner || isDraw
  const isWin = !isDraw && winner === myPlayerId

  useEffect(() => {
    if (!isVisible) return
    audioSystem.play(isWin ? "game_win" : isDraw ? "game_win" : "game_lose")
  }, [isVisible, isWin, isDraw])

  const title = isDraw ? "DRAW" : isWin ? "VICTORY" : "DEFEAT"
  const subtitle = isDraw ? "An even match." : isWin ? "Well played, Spellcrafter!" : "Better luck next time."
  const panelBg = isDraw ? "bg-cyber-violet/80" : isWin ? "bg-neon/20" : "bg-life-red"
  const titleColor = isDraw ? "text-text-primary" : isWin ? "text-neon" : "text-panel"

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-void/80 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className={`relative overflow-hidden rounded-sm border-[2px] border-rim p-10 text-center ${panelBg} shadow-panel-lg`}
            variants={gameOverVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="tex-grid opacity-20" />

            <div className="relative z-10 mx-auto mb-4 h-[2px] w-20 bg-neon/60" />

            <p className={`relative z-10 font-impact text-7xl uppercase leading-none tracking-tight ${titleColor}`}>
              {title}
            </p>
            <p className={`relative z-10 mt-3 font-body text-sm ${isDraw || isWin ? "text-text-primary" : "text-panel/80"}`}>{subtitle}</p>

            <div className="relative z-10 mx-auto mt-4 h-[2px] w-20 bg-neon/60" />

            <Link
              href="/"
              className="relative z-10 mt-6 inline-block rounded-sm border-[2px] border-rim bg-panel px-6 py-2.5 font-impact text-sm uppercase tracking-tight text-text-primary shadow-panel-sm transition-all hover:bg-neon/20 hover:text-neon hover:border-neon hover:shadow-none"
            >
              RETURN TO LOBBY
            </Link>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
