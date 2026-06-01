"use client"

import React from "react"
import { CardClass, CardType, Rarity } from "@tcg/shared-types"
import type { CardDraft } from "./types"

interface Props {
  draft: CardDraft
  onChange: (patch: Partial<CardDraft>) => void
}

const labelCls = "block text-[11px] font-bold text-ink uppercase tracking-wide mb-0.5"
const inputCls =
  "w-full rounded-sm border-[2px] border-ink bg-parchment px-2 py-1 text-xs text-ink font-mono focus:outline-none focus:border-gold"
const selectCls =
  "w-full rounded-sm border-[2px] border-ink bg-parchment px-2 py-1 text-xs text-ink font-mono focus:outline-none focus:border-gold"

export function MetadataSection({ draft, onChange }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Card ID</label>
          <input
            className={inputCls}
            value={draft.id}
            placeholder="iron_sentinel"
            onChange={(e) => onChange({ id: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") })}
          />
        </div>
        <div>
          <label className={labelCls}>Type</label>
          <select
            className={selectCls}
            value={draft.type}
            onChange={(e) => onChange({ type: e.target.value as CardType })}
          >
            <option value={CardType.Unit}>Unit</option>
            <option value={CardType.Spell}>Spell</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Cost</label>
          <input
            type="number"
            min={0}
            max={10}
            className={inputCls}
            value={draft.cost}
            onChange={(e) => onChange({ cost: Math.max(0, parseInt(e.target.value) || 0) })}
          />
        </div>
        <div>
          <label className={labelCls}>Infuse</label>
          <input
            type="number"
            min={0}
            max={10}
            className={inputCls}
            value={draft.infuse}
            onChange={(e) => onChange({ infuse: Math.max(0, parseInt(e.target.value) || 0) })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Rarity</label>
          <select
            className={selectCls}
            value={draft.rarity}
            onChange={(e) => onChange({ rarity: e.target.value as Rarity })}
          >
            {Object.values(Rarity).map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Class</label>
          <select
            className={selectCls}
            value={draft.cardClass}
            onChange={(e) => onChange({ cardClass: e.target.value as CardClass })}
          >
            {Object.values(CardClass).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isLegendary"
          checked={draft.isLegendary}
          onChange={(e) => onChange({ isLegendary: e.target.checked })}
          className="rounded-sm border-[2px] border-ink"
        />
        <label htmlFor="isLegendary" className={labelCls + " mb-0"}>Legendary / Ace</label>
      </div>
    </div>
  )
}
