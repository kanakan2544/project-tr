"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { getCard, getCardLocale } from "@tcg/card-data"
import { CardType } from "@tcg/shared-types"
import type { UnitInstance, UnitCardData, ActivatedAbility } from "@tcg/shared-types"
import {
  useCurrentAnimation,
  useIsAnimating,
} from "@/animation/animation-queue-context"
import { useCardTooltip } from "./CardTooltipContext"
import { DamageNumber } from "@/components/animation/DamageNumber"
import {
  unitLungeMyVariants,
  unitLungeOppVariants,
  unitImpactVariants,
  unitDeathVariants,
  primedGlowVariants,
  spellshieldBlockVariants,
} from "@/animation/framer-variants"

interface Props {
  unit: UnitInstance
  isMyUnit: boolean
  isTargetable?: boolean | undefined
  onAbilityClick?: ((unitInstanceId: string, abilityIndex: number) => void) | undefined
  onClick?: (() => void) | undefined
}

function tryGetUnitCard(cardId: string): UnitCardData | null {
  try {
    const c = getCard(cardId)
    return c.type === CardType.Unit ? (c as UnitCardData) : null
  } catch { return null }
}

export function UnitOnBoard({ unit, isMyUnit, isTargetable, onAbilityClick, onClick }: Props) {
  const card = tryGetUnitCard(unit.cardId)
  const locale = getCardLocale("en", unit.cardId)
  const [imgFailed, setImgFailed] = useState(false)
  const { show, hide } = useCardTooltip()

  const isLunging = useIsAnimating(unit.instanceId, "UNIT_LUNGE")
  const isImpact = useIsAnimating(unit.instanceId, "UNIT_IMPACT")
  const isDying = useIsAnimating(unit.instanceId, "UNIT_DEATH")
  const isPrimedAnim = useIsAnimating(unit.instanceId, "UNIT_PRIMED_GLOW")
  const isShieldBlock = useIsAnimating(unit.instanceId, "SPELLSHIELD_BLOCK")
  const isAbilityBurst = useIsAnimating(unit.instanceId, "ABILITY_BURST")

  const damageStep = useCurrentAnimation()
  const showDamage =
    damageStep?.kind === "DAMAGE_NUMBER" &&
    "targetInstanceId" in damageStep &&
    damageStep.targetInstanceId === unit.instanceId

  const atkDelta   = card ? unit.attack - card.attack : 0
  const maxHpDelta = card ? unit.maxHealth - card.health : 0
  const isDamaged  = unit.currentHealth < unit.maxHealth
  const atkBorder  = atkDelta > 0  ? "border-[#22c55e] drop-shadow-[0_0_6px_rgba(34,197,94,0.9)]"
                   : atkDelta < 0  ? "border-[#ef4444] drop-shadow-[0_0_6px_rgba(239,68,68,0.9)]"
                   : "border-rim"
  const hpBorder   = isDamaged     ? "border-[#ef4444] drop-shadow-[0_0_6px_rgba(239,68,68,0.9)]"
                   : maxHpDelta > 0 ? "border-[#22c55e] drop-shadow-[0_0_6px_rgba(34,197,94,0.9)]"
                   : "border-rim"

  const activatedAbilities = (card?.abilities ?? []).filter(
    (a): a is ActivatedAbility => a.kind === "activated"
  )
  const hasAvailableAbility =
    isMyUnit &&
    !unit.status.silenced &&
    activatedAbilities.some(
      (a, i) => !a.oncePerTurn || !unit.abilitiesUsedThisTurn.includes(i)
    )

  const isInCombatAnimation = isLunging || isImpact || isDying || isPrimedAnim || isShieldBlock || isAbilityBurst || showDamage

  const combatVariant = isDying ? "dead"
    : isLunging ? "lunge"
    : isImpact ? "impact"
    : isPrimedAnim || isAbilityBurst ? "glow"
    : isShieldBlock ? "block"
    : "alive"

  const variants = isDying ? unitDeathVariants
    : isLunging ? (isMyUnit ? unitLungeMyVariants : unitLungeOppVariants)
    : isImpact ? unitImpactVariants
    : isPrimedAnim || isAbilityBurst ? primedGlowVariants
    : isShieldBlock ? spellshieldBlockVariants
    : unitDeathVariants

  return (
    <motion.div
      layoutId={unit.instanceId}
      variants={variants}
      initial="alive"
      animate={
        isInCombatAnimation
          ? combatVariant
          : isTargetable
          ? { scale: [1, 1.04, 1], transition: { repeat: Infinity, duration: 0.9 } }
          : "alive"
      }
      onClick={onClick}
      onMouseEnter={(e) => show(unit.cardId, e.clientX, e.clientY, { overrideAttack: unit.attack, overrideHealth: unit.currentHealth, maxHealth: unit.maxHealth })}
      onMouseLeave={hide}
      className={[
        "relative flex h-40 w-32 flex-col overflow-hidden rounded-sm border-[2px] border-rim/80 bg-panel text-xs",
        isTargetable
          ? "cursor-pointer shadow-glow-red ring-[2px] ring-life-red/60"
          : isMyUnit
          ? "shadow-[0_0_10px_rgba(244,201,93,0.35)]"
          : "shadow-panel-sm",
        unit.status.standBy ? "grayscale" : "",
      ].join(" ")}
    >
        {/* Silenced overlay */}
        {unit.status.silenced && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-cyber-purple/20">
            <span className="text-base">🔇</span>
          </div>
        )}

        {/* Damage number */}
        {showDamage && damageStep && "damage" in damageStep && (
          <DamageNumber
            value={damageStep.damage as number}
            damageType={damageStep.damageType as "damage" | "heal"}
            stepId={damageStep.id}
          />
        )}

        {/* Name */}
        <div className="bg-panel-mid px-1 py-0.5">
          <span className="block w-full truncate text-center font-impact text-[11px] font-bold uppercase tracking-wide text-text-primary">
            {locale.name}
          </span>
        </div>

        {/* Card image — flex-1; status badges overlaid on top */}
        <div className="relative flex-1 overflow-hidden bg-panel-deep">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgFailed ? "/cards/d_d_001.jpg" : `/cards/${unit.cardId}.jpg`}
            alt={locale.name}
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover"
          />
          {/* Status badges — top of image */}
          <div className="absolute top-0 left-0 right-0 flex flex-wrap gap-0.5 p-0.5">
            {unit.status.standBy && (
              <span className="rounded-sm border-[2px] border-neon/70 bg-neon/20 px-1 text-[7px] font-bold text-neon">WAIT</span>
            )}
            {unit.isPrimed && (
              <span className="rounded-sm border-[2px] border-cyber-pink/80 bg-cyber-pink/70 px-1 text-[7px] font-bold text-panel">PRIMED</span>
            )}
            {unit.keywords.map((kw) => (
              <span key={kw} className="rounded-sm border-[2px] border-cyber-purple/60 bg-cyber-purple/30 px-1 text-[7px] font-bold text-cyber-violet">
                {kw}
              </span>
            ))}
          </div>

          {/* ATK / HP overlay — bottom of image */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between p-0.5">
            <span className={`rounded-sm border-[2px] ${atkBorder} bg-life-red px-1.5 font-mono text-xs font-bold text-panel`}>{unit.attack}</span>
            <span className={`rounded-sm border-[2px] ${hpBorder} bg-life-green px-1.5 font-mono text-xs font-bold text-panel`}>{unit.currentHealth}</span>
          </div>
        </div>

        {/* Ability button */}
        {hasAvailableAbility && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              const abilityIndex = activatedAbilities.findIndex(
                (a, i) => !a.oncePerTurn || !unit.abilitiesUsedThisTurn.includes(i)
              )
              if (abilityIndex >= 0) onAbilityClick?.(unit.instanceId, abilityIndex)
            }}
            title={activatedAbilities.find((a, i) => !a.oncePerTurn || !unit.abilitiesUsedThisTurn.includes(i))?.displayName ?? "Ability"}
            className="absolute bottom-6 right-1 rounded-sm border-[2px] border-neon bg-neon/20 px-1 py-0.5 text-[8px] font-bold text-neon shadow-glow-neon transition-all hover:shadow-none"
          >
            ⚡
          </button>
        )}
    </motion.div>
  )
}
