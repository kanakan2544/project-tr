"use client"

import React from "react"
import {
  EffectConditionType,
  EffectType,
  TargetType,
  TriggerType,
} from "@tcg/shared-types"
import {
  DEFAULT_ACTIVATED,
  DEFAULT_ACTION,
  DEFAULT_CONDITION,
  DEFAULT_TRIGGERED,
  EFFECT_NEEDS_CARD_ID,
  EFFECT_NEEDS_TARGET,
  EFFECT_NEEDS_VALUE,
} from "./types"
import type {
  CardDraft,
  DraftAbility,
  DraftAction,
  DraftActivatedAbility,
  DraftCondition,
  DraftTriggeredAbility,
} from "./types"

interface Props {
  abilities: CardDraft["abilities"]
  onChange: (abilities: CardDraft["abilities"]) => void
}

const labelCls = "block text-[10px] font-bold text-ink uppercase tracking-wide mb-0.5"
const inputCls =
  "w-full rounded-sm border-[2px] border-ink bg-parchment px-1.5 py-0.5 text-[11px] text-ink font-mono focus:outline-none focus:border-gold"
const selectCls =
  "w-full rounded-sm border-[2px] border-ink bg-parchment px-1.5 py-0.5 text-[11px] text-ink font-mono focus:outline-none focus:border-gold"
const btnSmCls =
  "rounded-sm border-[2px] border-ink bg-parchment px-2 py-0.5 text-[10px] font-bold text-ink hover:bg-gold/20 active:shadow-none shadow-[1px_1px_0_#15131a]"
const btnDangerCls =
  "rounded-sm border-[2px] border-ink bg-life-red/20 px-2 py-0.5 text-[10px] font-bold text-ink hover:bg-life-red/40 shadow-[1px_1px_0_#15131a]"

function ActionRow({
  action,
  index,
  onUpdate,
  onRemove,
}: {
  action: DraftAction
  index: number
  onUpdate: (patch: Partial<DraftAction>) => void
  onRemove: () => void
}) {
  return (
    <div className="rounded-sm border border-ink/20 bg-parchment-deep p-2 flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className={labelCls}>Action {index + 1}</span>
        <button type="button" onClick={onRemove} className={btnDangerCls}>✕</button>
      </div>

      <div>
        <label className={labelCls}>Effect Type</label>
        <select
          className={selectCls}
          value={action.type}
          onChange={(e) => onUpdate({ type: e.target.value as EffectType })}
        >
          {Object.values(EffectType).map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {EFFECT_NEEDS_TARGET.has(action.type) && (
        <div>
          <label className={labelCls}>Target</label>
          <select
            className={selectCls}
            value={action.target}
            onChange={(e) => onUpdate({ target: e.target.value as TargetType })}
          >
            {Object.values(TargetType).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      )}

      {EFFECT_NEEDS_VALUE.has(action.type) && (
        <div>
          <label className={labelCls}>Value</label>
          <input
            type="number"
            min={0}
            className={inputCls}
            value={action.value}
            onChange={(e) => onUpdate({ value: Math.max(0, parseInt(e.target.value) || 0) })}
          />
        </div>
      )}

      {EFFECT_NEEDS_CARD_ID.has(action.type) && (
        <div>
          <label className={labelCls}>Card ID</label>
          <input
            className={inputCls}
            placeholder="card_id"
            value={action.cardId}
            onChange={(e) => onUpdate({ cardId: e.target.value })}
          />
        </div>
      )}
    </div>
  )
}

function ConditionRow({
  cond,
  index,
  onUpdate,
  onRemove,
}: {
  cond: DraftCondition
  index: number
  onUpdate: (patch: Partial<DraftCondition>) => void
  onRemove: () => void
}) {
  return (
    <div className="rounded-sm border border-ink/20 bg-parchment-deep p-2 flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className={labelCls}>Condition {index + 1}</span>
        <button type="button" onClick={onRemove} className={btnDangerCls}>✕</button>
      </div>

      <div>
        <label className={labelCls}>Type</label>
        <select
          className={selectCls}
          value={cond.type}
          onChange={(e) => onUpdate({ type: e.target.value as EffectConditionType })}
        >
          {Object.values(EffectConditionType).map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {cond.type === EffectConditionType.CONTROLS_X_UNITS && (
        <div>
          <label className={labelCls}>X (units)</label>
          <input
            type="number"
            min={1}
            className={inputCls}
            value={cond.value}
            onChange={(e) => onUpdate({ value: Math.max(1, parseInt(e.target.value) || 1) })}
          />
        </div>
      )}
    </div>
  )
}

function TriggeredAbilityRow({
  ab,
  index,
  onUpdate,
  onRemove,
}: {
  ab: DraftTriggeredAbility
  index: number
  onUpdate: (updated: DraftTriggeredAbility) => void
  onRemove: () => void
}) {
  function updateAction(i: number, patch: Partial<DraftAction>) {
    const actions = ab.actions.map((a, idx) => (idx === i ? { ...a, ...patch } : a))
    onUpdate({ ...ab, actions })
  }
  function removeAction(i: number) {
    onUpdate({ ...ab, actions: ab.actions.filter((_, idx) => idx !== i) })
  }
  function addAction() {
    onUpdate({ ...ab, actions: [...ab.actions, { ...DEFAULT_ACTION }] })
  }
  function updateCondition(i: number, patch: Partial<DraftCondition>) {
    const conditions = ab.conditions.map((c, idx) => (idx === i ? { ...c, ...patch } : c))
    onUpdate({ ...ab, conditions })
  }
  function removeCondition(i: number) {
    onUpdate({ ...ab, conditions: ab.conditions.filter((_, idx) => idx !== i) })
  }
  function addCondition() {
    onUpdate({ ...ab, conditions: [...ab.conditions, { ...DEFAULT_CONDITION }] })
  }

  return (
    <div className="rounded-sm border-[2px] border-gold/60 bg-gold/10 p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-warm-brown uppercase tracking-wide">
          Triggered Ability {index + 1}
        </span>
        <button type="button" onClick={onRemove} className={btnDangerCls}>Remove</button>
      </div>

      <div>
        <label className={labelCls}>Trigger</label>
        <select
          className={selectCls}
          value={ab.trigger}
          onChange={(e) => onUpdate({ ...ab, trigger: e.target.value as TriggerType })}
        >
          {Object.values(TriggerType).map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className={labelCls}>Conditions</span>
          <button type="button" onClick={addCondition} className={btnSmCls}>+ Condition</button>
        </div>
        {ab.conditions.map((c, i) => (
          <ConditionRow
            key={i}
            cond={c}
            index={i}
            onUpdate={(patch) => updateCondition(i, patch)}
            onRemove={() => removeCondition(i)}
          />
        ))}
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className={labelCls}>Actions</span>
          <button type="button" onClick={addAction} className={btnSmCls}>+ Action</button>
        </div>
        {ab.actions.map((a, i) => (
          <ActionRow
            key={i}
            action={a}
            index={i}
            onUpdate={(patch) => updateAction(i, patch)}
            onRemove={() => removeAction(i)}
          />
        ))}
        {ab.actions.length === 0 && (
          <p className="text-[10px] text-warm-muted italic">No actions yet</p>
        )}
      </div>
    </div>
  )
}

function ActivatedAbilityRow({
  ab,
  index,
  onUpdate,
  onRemove,
}: {
  ab: DraftActivatedAbility
  index: number
  onUpdate: (updated: DraftActivatedAbility) => void
  onRemove: () => void
}) {
  function updateAction(i: number, patch: Partial<DraftAction>) {
    const actions = ab.actions.map((a, idx) => (idx === i ? { ...a, ...patch } : a))
    onUpdate({ ...ab, actions })
  }
  function removeAction(i: number) {
    onUpdate({ ...ab, actions: ab.actions.filter((_, idx) => idx !== i) })
  }
  function addAction() {
    onUpdate({ ...ab, actions: [...ab.actions, { ...DEFAULT_ACTION }] })
  }
  function updateCondition(i: number, patch: Partial<DraftCondition>) {
    const conditions = ab.conditions.map((c, idx) => (idx === i ? { ...c, ...patch } : c))
    onUpdate({ ...ab, conditions })
  }
  function removeCondition(i: number) {
    onUpdate({ ...ab, conditions: ab.conditions.filter((_, idx) => idx !== i) })
  }
  function addCondition() {
    onUpdate({ ...ab, conditions: [...ab.conditions, { ...DEFAULT_CONDITION }] })
  }

  return (
    <div className="rounded-sm border-[2px] border-magic-sky/60 bg-magic-sky/10 p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-warm-brown uppercase tracking-wide">
          Activated Ability {index + 1}
        </span>
        <button type="button" onClick={onRemove} className={btnDangerCls}>Remove</button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelCls}>Display Name</label>
          <input
            className={inputCls}
            placeholder="Ability name"
            value={ab.displayName}
            onChange={(e) => onUpdate({ ...ab, displayName: e.target.value })}
          />
        </div>
        <div>
          <label className={labelCls}>Activation Cost</label>
          <input
            type="number"
            min={0}
            className={inputCls}
            value={ab.activationCost}
            onChange={(e) =>
              onUpdate({ ...ab, activationCost: Math.max(0, parseInt(e.target.value) || 0) })
            }
          />
        </div>
      </div>

      <div className="flex gap-4">
        <label className="flex items-center gap-1.5 text-[10px] font-bold text-ink uppercase">
          <input
            type="checkbox"
            checked={ab.oncePerTurn}
            onChange={(e) => onUpdate({ ...ab, oncePerTurn: e.target.checked })}
          />
          Once / Turn
        </label>
        <label className="flex items-center gap-1.5 text-[10px] font-bold text-ink uppercase">
          <input
            type="checkbox"
            checked={ab.oncePerGame}
            onChange={(e) => onUpdate({ ...ab, oncePerGame: e.target.checked })}
          />
          Once / Game
        </label>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className={labelCls}>Conditions</span>
          <button type="button" onClick={addCondition} className={btnSmCls}>+ Condition</button>
        </div>
        {ab.conditions.map((c, i) => (
          <ConditionRow
            key={i}
            cond={c}
            index={i}
            onUpdate={(patch) => updateCondition(i, patch)}
            onRemove={() => removeCondition(i)}
          />
        ))}
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className={labelCls}>Actions</span>
          <button type="button" onClick={addAction} className={btnSmCls}>+ Action</button>
        </div>
        {ab.actions.map((a, i) => (
          <ActionRow
            key={i}
            action={a}
            index={i}
            onUpdate={(patch) => updateAction(i, patch)}
            onRemove={() => removeAction(i)}
          />
        ))}
        {ab.actions.length === 0 && (
          <p className="text-[10px] text-warm-muted italic">No actions yet</p>
        )}
      </div>
    </div>
  )
}

export function AbilityList({ abilities, onChange }: Props) {
  function updateAbility(i: number, updated: DraftAbility) {
    onChange(abilities.map((ab, idx) => (idx === i ? updated : ab)))
  }
  function removeAbility(i: number) {
    onChange(abilities.filter((_, idx) => idx !== i))
  }
  function addTriggered() {
    onChange([...abilities, { ...DEFAULT_TRIGGERED, conditions: [], actions: [...DEFAULT_TRIGGERED.actions] }])
  }
  function addActivated() {
    onChange([...abilities, { ...DEFAULT_ACTIVATED, conditions: [], actions: [...DEFAULT_ACTIVATED.actions] }])
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-ink uppercase tracking-wide">Abilities</span>
        <div className="flex gap-2">
          <button type="button" onClick={addTriggered} className={btnSmCls}>
            + Triggered
          </button>
          <button type="button" onClick={addActivated} className={btnSmCls}>
            + Activated
          </button>
        </div>
      </div>

      {abilities.length === 0 && (
        <p className="text-[11px] text-warm-muted italic">No abilities</p>
      )}

      {abilities.map((ab, i) =>
        ab.kind === "triggered" ? (
          <TriggeredAbilityRow
            key={i}
            ab={ab}
            index={i}
            onUpdate={(updated) => updateAbility(i, updated)}
            onRemove={() => removeAbility(i)}
          />
        ) : (
          <ActivatedAbilityRow
            key={i}
            ab={ab}
            index={i}
            onUpdate={(updated) => updateAbility(i, updated)}
            onRemove={() => removeAbility(i)}
          />
        )
      )}
    </div>
  )
}
