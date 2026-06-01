import type { GameEvent, Phase } from "@tcg/shared-types"

export type AnimationStepKind =
  | "SUMMON_FLY_IN"
  | "UNIT_LUNGE"
  | "UNIT_IMPACT"
  | "DAMAGE_NUMBER"
  | "HEALTH_BAR_UPDATE"
  | "UNIT_DEATH"
  | "SPELL_FLASH"
  | "PHASE_BANNER"
  | "TURN_INDICATOR"
  | "PLAYER_DAMAGE_SHAKE"
  | "ACE_UNLOCK"
  | "REVOLVE_PULSE"
  | "UNIT_PRIMED_GLOW"
  | "SPELLSHIELD_BLOCK"
  | "ABILITY_BURST"
  | "IDLE"

interface Base {
  readonly id: string
  readonly durationMs: number
  readonly sourceEvent: GameEvent
}

export type AnimationStep =
  | (Base & { kind: "SUMMON_FLY_IN"; targetInstanceId: string; targetLane: number })
  | (Base & { kind: "UNIT_LUNGE"; targetInstanceId: string })
  | (Base & { kind: "UNIT_IMPACT"; targetInstanceId: string })
  | (Base & { kind: "DAMAGE_NUMBER"; targetInstanceId: string; damage: number; damageType: "damage" | "heal" })
  | (Base & { kind: "HEALTH_BAR_UPDATE"; targetInstanceId: string })
  | (Base & { kind: "UNIT_DEATH"; targetInstanceId: string; targetLane: number; targetOwner: string })
  | (Base & { kind: "SPELL_FLASH"; targetInstanceId: string })
  | (Base & { kind: "PHASE_BANNER"; toPhase: Phase })
  | (Base & { kind: "TURN_INDICATOR"; activePlayer: string })
  | (Base & { kind: "PLAYER_DAMAGE_SHAKE"; targetPlayerId: string; damage: number })
  | (Base & { kind: "ACE_UNLOCK"; targetPlayerId: string })
  | (Base & { kind: "REVOLVE_PULSE"; targetPlayerId: string })
  | (Base & { kind: "UNIT_PRIMED_GLOW"; targetInstanceId: string })
  | (Base & { kind: "SPELLSHIELD_BLOCK"; targetInstanceId: string })
  | (Base & { kind: "ABILITY_BURST"; targetInstanceId: string })
  | (Base & { kind: "IDLE" })
