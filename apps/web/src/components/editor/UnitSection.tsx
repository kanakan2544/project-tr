"use client"

import React from "react"
import { Keyword, PrimedConditionType } from "@tcg/shared-types"
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

const ALL_KEYWORDS = Object.values(Keyword)

function KeywordToggle({
  selected,
  onChange,
}: {
  selected: Keyword[]
  onChange: (kws: Keyword[]) => void
}) {
  function toggle(kw: Keyword) {
    if (selected.includes(kw)) {
      onChange(selected.filter((k) => k !== kw))
    } else {
      onChange([...selected, kw])
    }
  }
  return (
    <div className="flex flex-wrap gap-1">
      {ALL_KEYWORDS.map((kw) => {
        const active = selected.includes(kw)
        return (
          <button
            key={kw}
            type="button"
            onClick={() => toggle(kw)}
            className={[
              "rounded-sm border-[2px] px-1.5 py-0.5 text-[10px] font-bold transition-colors",
              active
                ? "border-ink bg-magic-blush text-magic-purple shadow-[1px_1px_0_#15131a]"
                : "border-ink/40 bg-parchment text-ink/50 hover:border-ink hover:text-ink",
            ].join(" ")}
          >
            {kw}
          </button>
        )
      })}
    </div>
  )
}

export function UnitSection({ draft, onChange }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Attack</label>
          <input
            type="number"
            min={0}
            className={inputCls}
            value={draft.attack}
            onChange={(e) => onChange({ attack: Math.max(0, parseInt(e.target.value) || 0) })}
          />
        </div>
        <div>
          <label className={labelCls}>Health</label>
          <input
            type="number"
            min={1}
            className={inputCls}
            value={draft.health}
            onChange={(e) => onChange({ health: Math.max(1, parseInt(e.target.value) || 1) })}
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>Keywords</label>
        <KeywordToggle
          selected={draft.keywords}
          onChange={(kws) => onChange({ keywords: kws })}
        />
      </div>

      {/* Primed */}
      <div className="rounded-sm border-[2px] border-ink/30 bg-magic-rose/20 p-3">
        <div className="flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            id="hasPrimed"
            checked={draft.hasPrimed}
            onChange={(e) => onChange({ hasPrimed: e.target.checked })}
          />
          <label htmlFor="hasPrimed" className={labelCls + " mb-0"}>Primed Mechanic</label>
        </div>

        {draft.hasPrimed && (
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Condition</label>
                <select
                  className={selectCls}
                  value={draft.primedConditionType}
                  onChange={(e) =>
                    onChange({ primedConditionType: e.target.value as PrimedConditionType })
                  }
                >
                  <option value={PrimedConditionType.REVOLVED_X_TIMES}>Revolved ×N</option>
                  <option value={PrimedConditionType.INFUSED_X_TIMES}>Infused ×N</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>N (times)</label>
                <input
                  type="number"
                  min={1}
                  className={inputCls}
                  value={draft.primedConditionValue}
                  onChange={(e) =>
                    onChange({ primedConditionValue: Math.max(1, parseInt(e.target.value) || 1) })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Primed ATK</label>
                <input
                  type="number"
                  min={0}
                  placeholder="unchanged"
                  className={inputCls}
                  value={draft.primedStatAttack === "" ? "" : draft.primedStatAttack}
                  onChange={(e) =>
                    onChange({
                      primedStatAttack: e.target.value === "" ? "" : parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <label className={labelCls}>Primed HP</label>
                <input
                  type="number"
                  min={1}
                  placeholder="unchanged"
                  className={inputCls}
                  value={draft.primedStatHealth === "" ? "" : draft.primedStatHealth}
                  onChange={(e) =>
                    onChange({
                      primedStatHealth: e.target.value === "" ? "" : parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Primed Keywords</label>
              <KeywordToggle
                selected={draft.primedKeywords}
                onChange={(kws) => onChange({ primedKeywords: kws })}
              />
            </div>
          </div>
        )}
      </div>

      {/* Aura */}
      <div className="rounded-sm border-[2px] border-ink/30 bg-magic-lavender/20 p-3">
        <div className="flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            id="hasAura"
            checked={draft.hasAura}
            onChange={(e) => onChange({ hasAura: e.target.checked })}
          />
          <label htmlFor="hasAura" className={labelCls + " mb-0"}>Aura (Adjacent Allies)</label>
        </div>

        {draft.hasAura && (
          <div className="flex flex-col gap-2">
            <div>
              <label className={labelCls}>ATK bonus</label>
              <input
                type="number"
                min={0}
                placeholder="0"
                className={inputCls}
                value={draft.auraAttack === "" ? "" : draft.auraAttack}
                onChange={(e) =>
                  onChange({
                    auraAttack: e.target.value === "" ? "" : parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="auraPerRevolve"
                checked={draft.auraPerRevolve}
                onChange={(e) => onChange({ auraPerRevolve: e.target.checked })}
              />
              <label htmlFor="auraPerRevolve" className={labelCls + " mb-0"}>
                Per Revolve Count
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
