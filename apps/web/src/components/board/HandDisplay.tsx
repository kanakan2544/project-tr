"use client"

import { useDraggable } from "@dnd-kit/core"
import { CardView } from "./CardView"
import type { CardInstance } from "@tcg/shared-types"

interface DraggableCardProps {
  card: CardInstance
  selected: boolean
  disabled: boolean
  onClick?: (() => void) | undefined
}

function DraggableCard({ card, selected, disabled, onClick }: DraggableCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: card.instanceId,
    data: { type: "hand-card", cardInstanceId: card.instanceId, cardId: card.cardId },
    disabled,
  })

  return (
    <div ref={setNodeRef} {...attributes} {...listeners}>
      <CardView
        cardId={card.cardId}
        size="hand"
        selected={selected}
        disabled={disabled}
        dragging={isDragging}
        instanceId={card.instanceId}
        infuseValueBonus={card.infuseValueBonus}
        onClick={!disabled ? onClick : undefined}
      />
    </div>
  )
}

interface Props {
  hand: CardInstance[]
  onCardClick?: (instanceId: string) => void
  selectedId?: string | null
  selectedIds?: string[] | undefined
  disabled?: boolean
}


function CardBackFace() {
  return (
    <div
      className="relative h-20 w-14 overflow-hidden rounded-sm border-[2px] border-rim/70 bg-panel shadow-panel-sm"
      style={{ backgroundImage: "repeating-linear-gradient(45deg, rgba(255,122,60,0.05) 0px, rgba(255,122,60,0.05) 4px, transparent 4px, transparent 12px)" }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-impact text-[8px] uppercase tracking-wider text-foe opacity-30">TCG</span>
      </div>
    </div>
  )
}

interface OpponentHandProps {
  count: number
}

export function OpponentHandDisplay({ count }: OpponentHandProps) {
  const visible = Math.min(count, 10)
  return (
    <div className="flex items-center justify-center gap-1">
      {Array.from({ length: visible }).map((_, i) => (
        <CardBackFace key={i} />
      ))}
      {count > 10 && (
        <span className="font-impact text-xs text-text-muted2">+{count - 5}</span>
      )}
      {count === 0 && (
        <span className="font-body text-xs text-text-muted2">No cards</span>
      )}
    </div>
  )
}

export function HandDisplay({ hand, onCardClick, selectedId, selectedIds, disabled }: Props) {
  return (
    <div className="flex items-end justify-center gap-2 rounded-t-sm border-t-[2px] border-rim bg-panel/90 px-3 py-1 shadow-[0_-4px_16px_rgba(0,0,0,0.6)]">
      {hand.map((card, i) => (
        <div
          key={card.instanceId}
          className="relative hover:z-20 transition-[z-index]"
          style={{ zIndex: i }}
        >
          <DraggableCard
            card={card}
            selected={selectedId === card.instanceId || (selectedIds?.includes(card.instanceId) ?? false)}
            disabled={!!disabled}
            onClick={() => onCardClick?.(card.instanceId)}
          />
        </div>
      ))}
    </div>
  )
}
