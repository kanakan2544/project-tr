export const SOUND_KEYS = [
  "summon",
  "attack",
  "damage_unit",
  "damage_player",
  "spell_cast",
  "unit_death",
  "phase_change",
  "turn_start",
  "ace_unlock",
  "heal",
  "revolve",
  "primed",
  "spellshield",
  "game_win",
  "game_lose",
] as const

export type SoundKey = (typeof SOUND_KEYS)[number]
