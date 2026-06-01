"use client"

import type { CardInstance } from "@tcg/shared-types"
import { CardView } from "./CardView"

function CardBackFace() {
  return (
    <div
      className="relative h-[176px] w-32 overflow-hidden rounded-sm border-[2px] border-rim/70 bg-panel shadow-panel-sm"
      style={{ backgroundImage: "repeating-linear-gradient(45deg, rgba(244,201,93,0.04) 0px, rgba(244,201,93,0.04) 4px, transparent 4px, transparent 12px)" }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-impact text-[10px] uppercase tracking-wider text-neon opacity-30">TCG</span>
      </div>
    </div>
  )
}

interface PileModalProps {
  title: string
  cards: CardInstance[]
  faceDown?: boolean
  onClose: () => void
}

export function PileModal({ title, cards, faceDown, onClose }: PileModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-void/80"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-[900px] max-w-[95vw] flex-col rounded-sm border-[2px] border-rim bg-panel shadow-panel-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-[2px] border-rim/80 bg-panel-deep px-4 py-2">
          <span className="font-impact text-sm uppercase tracking-tight text-text-primary">{title}</span>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] text-text-muted">{cards.length} cards</span>
            <button
              onClick={onClose}
              className="font-impact text-lg leading-none text-text-muted transition-colors hover:text-text-primary"
            >
              ×
            </button>
          </div>
        </div>

        {/* Card grid */}
        <div className="overflow-y-auto p-3">
          {cards.length === 0 ? (
            <p className="py-8 text-center font-body text-sm text-text-muted">No cards</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {cards.map((card) =>
                faceDown ? (
                  <CardBackFace key={card.instanceId} />
                ) : (
                  <CardView key={card.instanceId} cardId={card.cardId} size="tooltip" infuseValueBonus={card.infuseValueBonus} />
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
