"use client"

import { useDroppable } from "@dnd-kit/core"

interface Props {
  isActive?: boolean | undefined
  infuseValue?: number | undefined
  interactive?: boolean | undefined
  resourceCount?: number | undefined
  currentResources?: number | undefined
}

export function InfuseZone({ isActive, infuseValue, interactive = true, resourceCount, currentResources }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: "drop:infuse", disabled: !interactive })

  if (!interactive) {
    return (
      <div className="flex h-[88px] w-[88px] flex-col items-center justify-center gap-0.5 rounded-full border-[2px] border-rim/60 bg-panel shadow-panel-sm animate-energy-pulse">
        <span className="font-impact text-[7px] uppercase tracking-widest text-text-muted2">ENERGY</span>
        <span className="font-mono text-3xl font-bold leading-none text-neon">{resourceCount ?? 0}</span>
      </div>
    )
  }

  const res = currentResources ?? 0

  return (
    <div
      ref={setNodeRef}
      className={[
        "relative flex h-[88px] w-[88px] flex-col items-center justify-center gap-0.5 overflow-hidden rounded-full border-[2px] font-impact uppercase tracking-tight transition-all",
        isOver
          ? "border-neon bg-neon/15 shadow-glow-neon-lg"
          : isActive
          ? "border-neon/70 bg-neon/[0.08] shadow-glow-neon animate-energy-pulse"
          : "border-rim/60 bg-panel shadow-panel-sm animate-energy-pulse",
      ].join(" ")}
    >
      {isOver && <span className="absolute inset-0 animate-neon-shimmer rounded-full" />}
      <span className="relative z-10 font-impact text-[7px] uppercase tracking-widest text-text-muted2">ENERGY</span>
      <span
        className="relative z-10 font-mono text-4xl font-bold leading-none text-neon"
        style={res > 0 ? { textShadow: '0 0 12px rgba(244,201,93,0.5)' } : undefined}
      >
        {res}
      </span>
      <span className="relative z-10 text-[8px] text-text-muted2">
        {isOver && infuseValue != null ? `+${infuseValue}` : "NEXUS"}
      </span>
    </div>
  )
}
