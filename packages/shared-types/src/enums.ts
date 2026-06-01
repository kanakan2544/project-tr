export enum Phase {
  START_TURN = "START_TURN",
  MAIN_PHASE = "MAIN_PHASE",
  ATTACK_PHASE = "ATTACK_PHASE",
  END_TURN_SELECT = "END_TURN_SELECT",
  END_TURN = "END_TURN",
}

export enum CardType {
  Unit = "Unit",
  Spell = "Spell",
}

export enum SpellType {
  Normal = "Normal",
}

export enum Rarity {
  Common = "Common",
  Uncommon = "Uncommon",
  Rare = "Rare",
  Legendary = "Legendary",
}

export enum CardClass {
  Warrior = "Warrior",
  Scholar = "Scholar",
  Machine = "Machine",
  Abyss = "Abyss",
  Neutral = "Neutral",
  Invincible = "Invincible",
}

export enum Keyword {
  // Combat
  Charge = "Charge",
  QuickAttack = "QuickAttack",
  DoubleAttack = "DoubleAttack",
  Overkill = "Overkill",
  Lifesteal = "Lifesteal",
  Ambush = "Ambush",
  Evasion = "Evasion",
  Piercing = "Piercing",
  // Defensive
  Guard = "Guard",
  Barrier = "Barrier",
  Spellshield = "Spellshield",
  Defender = "Defender",
  Steadfast = "Steadfast",
  Silence = "Silence",
  // Trigger Positioning
  Lonesome = "Lonesome",
}

export enum TriggerType {
  ON_PLAY = "ON_PLAY",
  ON_SUMMON = "ON_SUMMON",
  ON_ATTACK = "ON_ATTACK",
  ON_DAMAGE = "ON_DAMAGE",
  ON_DESTROY = "ON_DESTROY",
  ON_KILL = "ON_KILL",
  ON_HIT = "ON_HIT",
  ON_INFUSE = "ON_INFUSE",
  ON_REVOLVE = "ON_REVOLVE",
  START_TURN = "START_TURN",
  END_TURN = "END_TURN",
}

export enum EffectType {
  DEAL_DAMAGE = "DEAL_DAMAGE",
  HEAL = "HEAL",
  BUFF_ATTACK = "BUFF_ATTACK",
  BUFF_HEALTH = "BUFF_HEALTH",
  DESTROY_UNIT = "DESTROY_UNIT",
  SILENCE = "SILENCE",
  DRAW_CARD = "DRAW_CARD",
  SUMMON_TOKEN = "SUMMON_TOKEN",
  REVOLVE_DECK_TOP = "REVOLVE_DECK_TOP",
  ADD_CARD_TO_HAND = "ADD_CARD_TO_HAND",
  RETURN_SELF_TO_REVOLVE = "RETURN_SELF_TO_REVOLVE",
  SEND_REVOLVE_TO_DISCARD = "SEND_REVOLVE_TO_DISCARD",
  REVOLVE_TO_DECK = "REVOLVE_TO_DECK",
  GRANT_ABILITY = "GRANT_ABILITY",
}

export enum TargetType {
  SELF = "SELF",
  ALLY_UNIT = "ALLY_UNIT",
  ENEMY_UNIT = "ENEMY_UNIT",
  ANY_UNIT = "ANY_UNIT",
  ALLY_PLAYER = "ALLY_PLAYER",
  ENEMY_PLAYER = "ENEMY_PLAYER",
  ALL_UNITS = "ALL_UNITS",
  ALL_ENEMY_UNITS = "ALL_ENEMY_UNITS",
  ALL_ALLY_UNITS = "ALL_ALLY_UNITS",
  OPPOSING_UNIT = "OPPOSING_UNIT",
}

export enum ActionType {
  SUMMON_UNIT = "SUMMON_UNIT",
  CAST_SPELL = "CAST_SPELL",
  INFUSE_CARD = "INFUSE_CARD",
  ACTIVATE_ABILITY = "ACTIVATE_ABILITY",
  END_MAIN_PHASE = "END_MAIN_PHASE",
  END_TURN_SELECT = "END_TURN_SELECT",
}

export enum ValidationError {
  NOT_YOUR_TURN = "NOT_YOUR_TURN",
  WRONG_PHASE = "WRONG_PHASE",
  CARD_NOT_IN_HAND = "CARD_NOT_IN_HAND",
  INSUFFICIENT_RESOURCES = "INSUFFICIENT_RESOURCES",
  LANE_OCCUPIED = "LANE_OCCUPIED",
  LANE_OUT_OF_BOUNDS = "LANE_OUT_OF_BOUNDS",
  INVALID_TARGET = "INVALID_TARGET",
  ACE_NOT_UNLOCKED = "ACE_NOT_UNLOCKED",
  UNIT_HAS_STAND_BY = "UNIT_HAS_STAND_BY",
  NOT_A_UNIT_CARD = "NOT_A_UNIT_CARD",
  ABILITY_ALREADY_USED = "ABILITY_ALREADY_USED",
  INVALID_KEEP_SELECTION = "INVALID_KEEP_SELECTION",
  ABILITY_NOT_FOUND = "ABILITY_NOT_FOUND",
}

export enum PrimedConditionType {
  INFUSED_X_TIMES = "INFUSED_X_TIMES",
  REVOLVED_X_TIMES = "REVOLVED_X_TIMES",
}

export enum EffectConditionType {
  SELF_IS_PRIMED = "SELF_IS_PRIMED",
  CONTROLS_X_UNITS = "CONTROLS_X_UNITS",
}
