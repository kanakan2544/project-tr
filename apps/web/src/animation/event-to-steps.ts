import type { GameEvent } from "@tcg/shared-types"
import type { AnimationStep } from "./types"
import { ANIMATION_DURATIONS } from "./constants"

let _counter = 0
function nextId(): string {
  return `anim-${++_counter}`
}

function idle(sourceEvent: GameEvent): AnimationStep {
  return { kind: "IDLE", id: nextId(), durationMs: 0, sourceEvent }
}

export function gameEventToSteps(event: GameEvent): AnimationStep[] {
  switch (event.type) {
    case "UNIT_SUMMONED":
      return [
        {
          kind: "SUMMON_FLY_IN",
          id: nextId(),
          durationMs: ANIMATION_DURATIONS.SUMMON_FLY_IN,
          sourceEvent: event,
          targetInstanceId: event.instanceId,
          targetLane: event.lane,
        },
      ]

    case "UNIT_DAMAGED": {
      const steps: AnimationStep[] = []
      if (event.attackerInstanceId) {
        steps.push({
          kind: "UNIT_LUNGE",
          id: nextId(),
          durationMs: ANIMATION_DURATIONS.UNIT_LUNGE,
          sourceEvent: event,
          targetInstanceId: event.attackerInstanceId,
        })
      }
      steps.push(
        {
          kind: "UNIT_IMPACT",
          id: nextId(),
          durationMs: ANIMATION_DURATIONS.UNIT_IMPACT,
          sourceEvent: event,
          targetInstanceId: event.instanceId,
        },
        {
          kind: "DAMAGE_NUMBER",
          id: nextId(),
          durationMs: ANIMATION_DURATIONS.DAMAGE_NUMBER,
          sourceEvent: event,
          targetInstanceId: event.instanceId,
          damage: event.damage,
          damageType: "damage",
        },
        {
          kind: "HEALTH_BAR_UPDATE",
          id: nextId(),
          durationMs: ANIMATION_DURATIONS.HEALTH_BAR_UPDATE,
          sourceEvent: event,
          targetInstanceId: event.instanceId,
        },
      )
      return steps
    }

    case "UNIT_DESTROYED":
      return [
        {
          kind: "UNIT_DEATH",
          id: nextId(),
          durationMs: ANIMATION_DURATIONS.UNIT_DEATH,
          sourceEvent: event,
          targetInstanceId: event.instanceId,
          targetLane: event.lane,
          targetOwner: event.owner,
        },
      ]

    case "PLAYER_DAMAGED": {
      const steps: AnimationStep[] = []
      if (event.attackerInstanceId) {
        steps.push({
          kind: "UNIT_LUNGE",
          id: nextId(),
          durationMs: ANIMATION_DURATIONS.UNIT_LUNGE,
          sourceEvent: event,
          targetInstanceId: event.attackerInstanceId,
        })
      }
      steps.push(
        {
          kind: "PLAYER_DAMAGE_SHAKE",
          id: nextId(),
          durationMs: ANIMATION_DURATIONS.PLAYER_DAMAGE_SHAKE,
          sourceEvent: event,
          targetPlayerId: event.playerId,
          damage: event.damage,
        },
        {
          kind: "DAMAGE_NUMBER",
          id: nextId(),
          durationMs: ANIMATION_DURATIONS.DAMAGE_NUMBER,
          sourceEvent: event,
          targetInstanceId: event.playerId,
          damage: event.damage,
          damageType: "damage",
        },
      )
      return steps
    }

    case "PLAYER_HEALED":
      return [
        {
          kind: "DAMAGE_NUMBER",
          id: nextId(),
          durationMs: ANIMATION_DURATIONS.DAMAGE_NUMBER,
          sourceEvent: event,
          targetInstanceId: event.playerId,
          damage: event.amount,
          damageType: "heal",
        },
      ]

    case "FATIGUE_DAMAGE":
      return [
        {
          kind: "PLAYER_DAMAGE_SHAKE",
          id: nextId(),
          durationMs: ANIMATION_DURATIONS.PLAYER_DAMAGE_SHAKE,
          sourceEvent: event,
          targetPlayerId: event.playerId,
          damage: event.damage,
        },
      ]

    case "PHASE_CHANGED":
      return [
        {
          kind: "PHASE_BANNER",
          id: nextId(),
          durationMs: ANIMATION_DURATIONS.PHASE_BANNER,
          sourceEvent: event,
          toPhase: event.to,
        },
      ]

    case "TURN_STARTED":
      return [
        {
          kind: "TURN_INDICATOR",
          id: nextId(),
          durationMs: ANIMATION_DURATIONS.TURN_INDICATOR,
          sourceEvent: event,
          activePlayer: event.activePlayer,
        },
      ]

    case "ACE_UNLOCKED":
      return [
        {
          kind: "ACE_UNLOCK",
          id: nextId(),
          durationMs: ANIMATION_DURATIONS.ACE_UNLOCK,
          sourceEvent: event,
          targetPlayerId: event.playerId,
        },
      ]

    case "REVOLVE_TRIGGERED":
      return [
        {
          kind: "REVOLVE_PULSE",
          id: nextId(),
          durationMs: ANIMATION_DURATIONS.REVOLVE_PULSE,
          sourceEvent: event,
          targetPlayerId: event.playerId,
        },
      ]

    case "UNIT_PRIMED":
      return [
        {
          kind: "UNIT_PRIMED_GLOW",
          id: nextId(),
          durationMs: ANIMATION_DURATIONS.UNIT_PRIMED_GLOW,
          sourceEvent: event,
          targetInstanceId: event.instanceId,
        },
      ]

    case "SPELLSHIELD_NEGATED":
      return [
        {
          kind: "SPELLSHIELD_BLOCK",
          id: nextId(),
          durationMs: ANIMATION_DURATIONS.SPELLSHIELD_BLOCK,
          sourceEvent: event,
          targetInstanceId: event.instanceId,
        },
      ]

    case "ABILITY_ACTIVATED":
      return [
        {
          kind: "ABILITY_BURST",
          id: nextId(),
          durationMs: ANIMATION_DURATIONS.ABILITY_BURST,
          sourceEvent: event,
          targetInstanceId: event.unitInstanceId,
        },
      ]

    case "UNIT_BUFFED":
      return [
        {
          kind: "UNIT_PRIMED_GLOW",
          id: nextId(),
          durationMs: ANIMATION_DURATIONS.UNIT_PRIMED_GLOW,
          sourceEvent: event,
          targetInstanceId: event.instanceId,
        },
      ]

    case "CARD_INFUSED":
    case "CARDS_DRAWN":
    case "TURN_ENDED":
    case "END_TURN_SELECT_REQUIRED":
    case "GAME_OVER":
    case "EFFECT_TRIGGERED":
    default:
      return [idle(event)]
  }
}
