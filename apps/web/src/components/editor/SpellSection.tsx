"use client"

import React from "react"
import { SpellType } from "@tcg/shared-types"
import type { CardDraft } from "./types"

interface Props {
  draft: CardDraft
  onChange: (patch: Partial<CardDraft>) => void
}

const labelCls = "block text-[11px] font-bold text-ink uppercase tracking-wide mb-0.5"
const selectCls =
  "w-full rounded-sm border-[2px] border-ink bg-parchment px-2 py-1 text-xs text-ink font-mono focus:outline-none focus:border-gold"

export function SpellSection({ draft, onChange }: Props) {
  return (
    <div>
      <label className={labelCls}>Spell Type</label>
      <select
        className={selectCls}
        value={draft.spellType}
        onChange={(e) => onChange({ spellType: e.target.value as SpellType })}
      >
        {Object.values(SpellType).map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
    </div>
  )
}
