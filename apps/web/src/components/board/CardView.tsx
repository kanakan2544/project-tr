"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { getCard, getCardLocale } from "@tcg/card-data"
import { CardType, Rarity } from "@tcg/shared-types"
import type { CardData, UnitCardData } from "@tcg/shared-types"
import { useCardTooltip } from "./CardTooltipContext"

const RARITY_SHADOW: Record<Rarity, string> = {
  [Rarity.Common]:    "shadow-[0_0_6px_rgba(0,0,0,0.4)]",
  [Rarity.Uncommon]:  "shadow-[0_0_10px_rgba(106,184,122,0.5)]",
  [Rarity.Rare]:      "shadow-[0_0_10px_rgba(244,201,93,0.5)]",
  [Rarity.Legendary]: "shadow-[0_0_14px_rgba(244,201,93,0.8),0_0_0_1px_#f4c95d]",
}

const SIZE: Record<"hand" | "board" | "tooltip", string> = {
  hand: "h-36 w-28",
  board: "h-36 w-28",
  tooltip: "w-64",
}

const TRIGGER_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  ON_SUMMON:  { bg: "bg-neon/20",          text: "text-neon",        label: "ON SUMMON" },
  ON_DESTROY: { bg: "bg-cyber-purple/70",  text: "text-panel",       label: "ON DESTROY" },
  ON_ATTACK:  { bg: "bg-life-red/80",      text: "text-panel",       label: "ON ATTACK" },
  ON_DAMAGE:  { bg: "bg-cyber-pink/70",    text: "text-panel",       label: "ON DAMAGE" },
  ON_INFUSE:  { bg: "bg-cyber-sky/70",     text: "text-panel",       label: "ON INFUSE" },
  ON_REVOLVE: { bg: "bg-cyber-violet/70",  text: "text-panel",       label: "ON REVOLVE" },
  ON_PLAY:    { bg: "bg-life-green/80",    text: "text-panel",       label: "ON PLAY" },
  START_TURN: { bg: "bg-cyber-teal/70",    text: "text-panel",       label: "START TURN" },
  END_TURN:   { bg: "bg-text-muted/50",    text: "text-panel",       label: "END TURN" },
}

const TRIGGER_REGEX = /(ON_SUMMON|ON_DESTROY|ON_ATTACK|ON_DAMAGE|ON_INFUSE|ON_REVOLVE|ON_PLAY|START_TURN|END_TURN)/

function highlightTriggers(text: string): React.ReactNode {
  return text.split(TRIGGER_REGEX).map((part, i) => {
    const style = TRIGGER_STYLES[part]
    if (style) {
      return <span key={i} className={`${style.bg} ${style.text} font-bold px-0.5 rounded-sm`}>{style.label}</span>
    }
    return part
  })
}

interface Props {
  cardId: string
  size?: "hand" | "board" | "tooltip"
  selected?: boolean | undefined
  disabled?: boolean | undefined
  dragging?: boolean | undefined
  instanceId?: string | undefined
  infuseValueBonus?: number | undefined
  overrideAttack?: number | undefined
  overrideHealth?: number | undefined
  overrideMaxHealth?: number | undefined
  onClick?: (() => void) | undefined
}

function tryGetCard(id: string): CardData | null {
  try { return getCard(id) } catch { return null }
}

function statBorder(delta: number): string {
  if (delta > 0) return "border-[#22c55e] drop-shadow-[0_0_6px_rgba(34,197,94,0.9)]"
  if (delta < 0) return "border-[#ef4444] drop-shadow-[0_0_6px_rgba(239,68,68,0.9)]"
  return "border-rim"
}

export function CardView({ cardId, size = "hand", selected, disabled, dragging, instanceId, infuseValueBonus, overrideAttack, overrideHealth, overrideMaxHealth, onClick }: Props) {
  const card = tryGetCard(cardId)
  const locale = getCardLocale("en", cardId)
  const rarityShadow = card ? RARITY_SHADOW[card.metadata.rarity] : "shadow-[0_0_6px_rgba(0,0,0,0.4)]"
  const [imgFailed, setImgFailed] = useState(false)
  const { show, hide } = useCardTooltip()

  const hoverProps = !disabled && !dragging && !selected ? { whileHover: { y: -8 } } : {}
  const layoutProps = !dragging && instanceId ? { layoutId: instanceId } : {}

  const isTooltip = size === "tooltip"

  const infuseBonus = infuseValueBonus ?? 0
  const infuseBorder = statBorder(infuseBonus)

  const baseUnitCard = card?.type === CardType.Unit ? (card as UnitCardData) : null
  const displayAtk = isTooltip && overrideAttack !== undefined ? overrideAttack : baseUnitCard?.attack
  const displayHp  = isTooltip && overrideHealth !== undefined ? overrideHealth : baseUnitCard?.health

  const atkBorder = (isTooltip && overrideAttack !== undefined && baseUnitCard)
    ? statBorder(overrideAttack - baseUnitCard.attack)
    : "border-rim"

  const hpBorder = (isTooltip && baseUnitCard && (overrideHealth !== undefined || overrideMaxHealth !== undefined))
    ? (() => {
        const isDamaged = overrideHealth !== undefined && overrideMaxHealth !== undefined && overrideHealth < overrideMaxHealth
        const isBuff = overrideMaxHealth !== undefined && overrideMaxHealth > baseUnitCard.health
        return isDamaged ? "border-[#ef4444]" : isBuff ? "border-[#22c55e]" : "border-rim"
      })()
    : "border-rim"

  return (
    <motion.div
      {...hoverProps}
      {...layoutProps}
      onMouseEnter={(!dragging && !isTooltip) ? (e) => show(cardId, e.clientX, e.clientY, { infuseValueBonus: infuseBonus }) : undefined}
      onMouseLeave={(!dragging && !isTooltip) ? hide : undefined}
      animate={
        dragging ? { opacity: 0.5, scale: 1.02 }
        : selected ? { y: -10, scale: 1.05 }
        : { y: 0, scale: 1 }
      }
      onClick={onClick}
      className={[
        "relative flex flex-col rounded-sm border-[2px] border-rim/80 bg-panel text-xs select-none overflow-hidden",
        SIZE[size],
        selected ? "shadow-glow-neon-ring" : rarityShadow,
        disabled ? "cursor-default" : onClick ? "cursor-pointer" : "",
      ].join(" ")}
    >
      {card ? (
        <>
          {/* Name — colored by card type */}
          <div className={[
            "shrink-0 px-1 py-0.5",
            card.type === CardType.Unit ? "bg-card-unit" : "bg-card-spell",
          ].join(" ")}>
            <span className={[
              "block w-full truncate text-center font-impact font-bold uppercase tracking-wide text-text-primary",
              isTooltip ? "text-[20px] py-1" : "text-[11px]",
            ].join(" ")}>
              {locale.name}
            </span>
          </div>

          {/* Card image — fixed height; badges overlay inside */}
          <div className={`relative overflow-hidden bg-panel-deep shrink-0 ${isTooltip ? "h-[240px]" : "h-[96px]"}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imgFailed ? "/cards/d_d_001.jpg" : `/cards/${cardId}.jpg`}
              alt={locale.name}
              onError={() => setImgFailed(true)}
                className="h-full w-full object-cover object-top"

            />

            {/* Infuse + cost overlay — top of image, all sizes except board */}
            {size !== "board" && (
              <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-0.5">
                <span className={`rounded-full border-[2px] ${infuseBorder} bg-neon/90 font-mono font-bold text-panel drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] ${isTooltip ? "px-2.5 py-1 text-[18px]" : "px-1.5 py-0 text-[10px]"}`}>
                  {card.infuse + infuseBonus}
                </span>
                <span className={`rounded-sm border-[2px] border-cyber-sky bg-cyber-sky/90 font-mono font-bold text-panel drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] ${isTooltip ? "px-1.5 py-0.5 text-[18px]" : "px-1 text-[10px]"}`}>
                  {card.cost}
                </span>
              </div>
            )}

            {/* ATK / HP overlay — bottom of image, units only */}
            {baseUnitCard && (
              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between p-0.5">
                <span className={`rounded-sm border-[2px] ${atkBorder} bg-life-red font-mono font-bold text-panel ${isTooltip ? "text-[20px] p-1" : "text-[11px] px-1"}`}>
                  {displayAtk ?? baseUnitCard.attack}
                </span>
                <span className={`rounded-sm border-[2px] ${hpBorder} bg-life-green font-mono font-bold text-panel ${isTooltip ? "text-[20px] p-1" : "text-[11px] px-1"}`}>
                  {displayHp ?? baseUnitCard.health}
                </span>
              </div>
            )}
          </div>

          {/* Keywords — tooltip size only */}
          {isTooltip && baseUnitCard && (baseUnitCard.keywords ?? []).length > 0 && (
            <div className="flex flex-wrap gap-0.5 px-1 pt-1">
              {(baseUnitCard.keywords ?? []).map((kw) => (
                <span key={kw} className="rounded-sm border-[2px] border-cyber-purple/60 bg-cyber-purple/30 px-1 text-[16px] font-bold text-cyber-violet">
                  {kw}
                </span>
              ))}
            </div>
          )}

          {/* Effect area */}
          {isTooltip ? (
            <div className="px-1 py-1 flex flex-col gap-0.5 min-h-[48px]">
              {locale.text
                ? locale.text.split("\n").map((line, i) => (
                    <span key={i} className="text-[15px] text-text-primary leading-tight">{highlightTriggers(line)}</span>
                  ))
                : null}
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-hidden px-0.5 pt-0.5">
              {locale.text ? locale.text.split("\n").map((line, i) => (
                <span key={i} className="block text-[8px] text-text-primary leading-tight">{highlightTriggers(line)}</span>
              )) : null}
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <span className="px-1 text-center text-[9px] text-text-muted">{cardId.replace(/_/g, " ")}</span>
        </div>
      )}
    </motion.div>
  )
}
