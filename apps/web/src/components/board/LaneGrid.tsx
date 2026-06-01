import type { LaneState } from "@tcg/shared-types"

interface Props {
  lanes: LaneState[]
  isOpponent?: boolean
}

export function LaneGrid({ lanes, isOpponent = false }: Props) {
  return (
    <div className={`flex gap-2 ${isOpponent ? "flex-row-reverse" : ""}`}>
      {lanes.map((lane) => (
        <div
          key={lane.index}
          className="flex h-28 w-20 flex-col items-center justify-center rounded-md border border-board-laneBorder bg-board-lane text-xs"
        >
          {lane.unit ? (
            <div className="flex flex-col items-center gap-1 p-1">
              <span className="text-[10px] font-semibold text-zinc-300 truncate w-16 text-center">
                {lane.unit.cardId.replace(/_/g, " ")}
              </span>
              <div className="flex gap-2 text-[11px]">
                <span className="text-orange-400">{lane.unit.attack}</span>
                <span className="text-slate-400">/</span>
                <span className="text-blue-400">
                  {lane.unit.currentHealth}/{lane.unit.maxHealth}
                </span>
              </div>
              {lane.unit.status.standBy && (
                <span className="rounded bg-yellow-900/60 px-1 text-[9px] text-yellow-300">standby</span>
              )}
              {lane.unit.keywords.length > 0 && (
                <span className="rounded bg-indigo-900/60 px-1 text-[9px] text-indigo-300">
                  {lane.unit.keywords.join(" ")}
                </span>
              )}
            </div>
          ) : (
            <span className="text-zinc-600">{lane.index}</span>
          )}
        </div>
      ))}
    </div>
  )
}
