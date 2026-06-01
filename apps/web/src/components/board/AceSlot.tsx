"use client"

import { useDraggable } from "@dnd-kit/core"
import { CardView } from "./CardView"
import type { CardInstance } from "@tcg/shared-types"

interface Props {
  ace: CardInstance | null
  revolveCount: number
  isMySlot: boolean
  selected?: boolean | undefined
  onSelect?: (() => void) | undefined
  className?: string | undefined
}

export function AceSlot({ ace, revolveCount, isMySlot, selected, onSelect, className }: Props) {
  const isUnlocked = revolveCount >= 1
  const canInteract = isMySlot && isUnlocked && !!ace

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: ace ? `ace-${ace.instanceId}` : "ace-empty",
    data: { type: "ace-card", cardInstanceId: ace?.instanceId, cardId: ace?.cardId },
    disabled: !canInteract,
  })

  return (
    <div className={["flex flex-col items-center gap-1", className].filter(Boolean).join(" ")}>
      <div ref={canInteract ? setNodeRef : undefined} {...(canInteract ? { ...attributes, ...listeners } : {})}>
        <div className="relative">
          <CardView
            cardId={ace?.cardId ?? "unknown"}
            size="hand"
            selected={selected}
            disabled={!ace || !isUnlocked}
            dragging={isDragging}
            infuseValueBonus={ace?.infuseValueBonus}
            onClick={canInteract ? onSelect : undefined}
          />
          {ace && !isUnlocked && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-sm border-[2px] border-rim/60 bg-panel-deep/85">
              <span className="font-impact text-xs uppercase text-text-muted">LOCKED</span>
              <span className="font-mono text-[8px] text-text-muted2">{revolveCount}/1</span>
            </div>
          )}
          {isUnlocked && (
            <div className={[
              "pointer-events-none absolute inset-0 rounded-sm ring-[2px]",
              isMySlot
                ? "ring-neon shadow-glow-neon"
                : "ring-foe shadow-glow-foe animate-foe-ring",
            ].join(" ")} />
          )}
        </div>
      </div>
      <span className={`font-impact text-[10px] uppercase tracking-tight ${isUnlocked ? (isMySlot ? "text-neon" : "text-foe") : "text-text-muted2"}`}>
        ACE
      </span>
    </div>
  )
}
