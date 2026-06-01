"use client"

import type { EventLogEntry } from "@/hooks/useDebugClient"

interface Props {
  entries: EventLogEntry[]
  lastError: string | null
}

export function EventLog({ entries, lastError }: Props) {
  return (
    <div className="flex flex-col gap-1 rounded-sm border-[3px] border-ink bg-parchment-2 p-3 text-xs shadow-ink-sm">
      <div className="mb-1 font-impact text-[11px] uppercase tracking-tight text-warm-brown">EVENT LOG</div>

      {lastError && (
        <div className="rounded-sm border-[2px] border-ink bg-life-red px-2 py-1 font-impact text-[10px] uppercase text-parchment shadow-ink-sm">
          ERROR: {lastError}
        </div>
      )}

      {entries.length === 0 && (
        <div className="font-mono text-[10px] italic text-warm-muted2">No events yet.</div>
      )}

      <div className="flex max-h-96 flex-col gap-1 overflow-y-auto">
        {entries.map((entry) => (
          <div key={entry.id} className="rounded-sm border-[2px] border-ink bg-parchment p-2 shadow-[1px_1px_0_#15131a]">
            <div className="mb-1 font-impact text-[10px] uppercase text-warm-brown">
              {entry.actionType}
              <span className="ml-2 font-mono font-normal text-warm-muted2">{new Date(entry.timestamp).toLocaleTimeString()}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              {entry.events.map((ev, i) => (
                <EventRow key={i} event={ev} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function EventRow({ event }: { event: Record<string, unknown> }) {
  const type = event["type"] as string
  const color = EVENT_COLOR[type] ?? "text-warm-muted2"
  const detail = formatEventDetail(event)
  return (
    <div className="flex gap-2">
      <span className={`font-impact text-[10px] uppercase shrink-0 ${color}`}>{type}</span>
      <span className="font-mono text-[9px] text-warm-muted2">{detail}</span>
    </div>
  )
}

const EVENT_COLOR: Record<string, string> = {
  UNIT_SUMMONED: "text-life-green",
  UNIT_DESTROYED: "text-life-red",
  UNIT_DAMAGED: "text-gold",
  PLAYER_DAMAGED: "text-life-red",
  PLAYER_HEALED: "text-life-green",
  CARDS_DRAWN: "text-magic-sky",
  CARD_INFUSED: "text-gold",
  EFFECT_TRIGGERED: "text-magic-purple",
  UNIT_BUFFED: "text-magic-periwinkle",
  UNIT_PRIMED: "text-magic-rose",
  ABILITY_ACTIVATED: "text-magic-sky",
}

function formatEventDetail(ev: Record<string, unknown>): string {
  const skip = new Set(["type"])
  return Object.entries(ev)
    .filter(([k]) => !skip.has(k))
    .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
    .join(" ")
}
