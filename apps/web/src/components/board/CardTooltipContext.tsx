"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { CardView } from "./CardView"

export interface StatOverrides {
  overrideAttack?: number
  overrideHealth?: number
  maxHealth?: number
  infuseValueBonus?: number
}

interface TooltipState {
  cardId: string
  x: number
  y: number
  overrides: StatOverrides
}

interface CardTooltipContextValue {
  show: (cardId: string, x: number, y: number, overrides?: StatOverrides) => void
  hide: () => void
}

const CardTooltipContext = createContext<CardTooltipContextValue>({
  show: () => {},
  hide: () => {},
})

const TOOLTIP_W = 256
const TOOLTIP_H = 360
const CURSOR_OFFSET_X = 16
const CURSOR_OFFSET_Y = 8

function TooltipOverlay({ cardId, x, y, overrides }: TooltipState) {
  const viewportW = typeof window !== "undefined" ? window.innerWidth : 1920
  const viewportH = typeof window !== "undefined" ? window.innerHeight : 1080

  const left = x + CURSOR_OFFSET_X + TOOLTIP_W < viewportW
    ? x + CURSOR_OFFSET_X
    : x - CURSOR_OFFSET_X - TOOLTIP_W

  const top = Math.min(Math.max(4, y + CURSOR_OFFSET_Y), viewportH - TOOLTIP_H - 4)

  return (
    <div className="pointer-events-none fixed z-[60]" style={{ top, left }}>
      <CardView
        cardId={cardId}
        size="tooltip"
        infuseValueBonus={overrides.infuseValueBonus}
        overrideAttack={overrides.overrideAttack}
        overrideHealth={overrides.overrideHealth}
        overrideMaxHealth={overrides.maxHealth}
      />
    </div>
  )
}

export function CardTooltipProvider({ children }: { children: React.ReactNode }) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  const show = useCallback((cardId: string, x: number, y: number, overrides?: StatOverrides) => {
    setTooltip({ cardId, x, y, overrides: overrides ?? {} })
  }, [])

  const hide = useCallback(() => {
    setTooltip(null)
  }, [])

  useEffect(() => {
    if (!tooltip) return
    function onMove(e: MouseEvent) {
      setTooltip((prev) => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)
    }
    window.addEventListener("mousemove", onMove)
    return () => window.removeEventListener("mousemove", onMove)
  }, [tooltip !== null]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <CardTooltipContext.Provider value={{ show, hide }}>
      {children}
      {tooltip && <TooltipOverlay {...tooltip} />}
    </CardTooltipContext.Provider>
  )
}

export function useCardTooltip() {
  return useContext(CardTooltipContext)
}
