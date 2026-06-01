import type { AnimationStep } from "@/animation/types"
import type { SoundKey } from "./sound-keys"

export function animationStepToSound(step: AnimationStep): SoundKey | null {
  switch (step.kind) {
    case "SUMMON_FLY_IN":       return "summon"
    case "UNIT_LUNGE":          return "attack"
    case "DAMAGE_NUMBER":       return step.damageType === "heal" ? "heal" : "damage_unit"
    case "UNIT_DEATH":          return "unit_death"
    case "SPELL_FLASH":         return "spell_cast"
    case "PHASE_BANNER":        return "phase_change"
    case "TURN_INDICATOR":      return "turn_start"
    case "ACE_UNLOCK":          return "ace_unlock"
    case "UNIT_PRIMED_GLOW":    return "primed"
    case "SPELLSHIELD_BLOCK":   return "spellshield"
    case "REVOLVE_PULSE":       return "revolve"
    case "PLAYER_DAMAGE_SHAKE": return "damage_player"
    case "ABILITY_BURST":
    case "HEALTH_BAR_UPDATE":
    case "IDLE":
    default:                    return null
  }
}
