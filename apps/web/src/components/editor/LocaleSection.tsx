"use client"

import React from "react"
import type { CardDraft } from "./types"

interface Props {
  draft: CardDraft
  onChange: (patch: Partial<CardDraft>) => void
}

const labelCls = "block text-[11px] font-bold text-ink uppercase tracking-wide mb-0.5"
const inputCls =
  "w-full rounded-sm border-[2px] border-ink bg-parchment px-2 py-1 text-xs text-ink font-mono focus:outline-none focus:border-gold"

export function LocaleSection({ draft, onChange }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className={labelCls}>Card Name</label>
        <input
          className={inputCls}
          placeholder="Iron Sentinel"
          value={draft.name}
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </div>

      <div>
        <label className={labelCls}>Effect Text</label>
        <textarea
          rows={3}
          className={inputCls + " resize-none"}
          placeholder="ON_SUMMON: Revolve top 1."
          value={draft.text}
          onChange={(e) => onChange({ text: e.target.value })}
        />
        <p className="text-[9px] text-warm-muted mt-0.5">
          Use trigger keywords: ON_SUMMON, ON_DESTROY, ON_ATTACK, etc.
        </p>
      </div>

      <div>
        <label className={labelCls}>Flavor Text</label>
        <input
          className={inputCls}
          placeholder="Optional flavor text"
          value={draft.flavorText}
          onChange={(e) => onChange({ flavorText: e.target.value })}
        />
      </div>
    </div>
  )
}
