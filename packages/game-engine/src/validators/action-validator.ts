import { ActionType, CardType, Phase, ValidationError } from "@tcg/shared-types"
import type { GameAction, GameState, ActivatedAbility } from "@tcg/shared-types"
import { getCard } from "@tcg/card-data"
import { findCardInHand, findUnitOnBattlefield, getOpponentId, getPlayer, isLaneEmpty } from "../utils/state-helpers"

function validateTurnOwnership(state: GameState, playerId: string): boolean {
  return state.activePlayer === playerId
}

function validateSummonUnit(state: GameState, action: Extract<GameAction, { type: ActionType.SUMMON_UNIT }>): string | null {
  if (state.phase !== Phase.MAIN_PHASE) return ValidationError.WRONG_PHASE

  const player = getPlayer(state, action.playerId)

  const cardInHand = findCardInHand(player, action.cardInstanceId)
  const isAceCard = !cardInHand && player.ace?.instanceId === action.cardInstanceId

  if (!cardInHand && !isAceCard) return ValidationError.CARD_NOT_IN_HAND

  if (isAceCard) {
    if (player.revolveCount < 1) return ValidationError.ACE_NOT_UNLOCKED
  }

  const cardId = cardInHand?.cardId ?? player.ace!.cardId
  const cardData = getCard(cardId)
  if (cardData.type !== CardType.Unit) return ValidationError.NOT_A_UNIT_CARD

  if (action.targetLane < 0 || action.targetLane > 4) return ValidationError.LANE_OUT_OF_BOUNDS
  if (!isLaneEmpty(player, action.targetLane)) return ValidationError.LANE_OCCUPIED
  if (player.temporaryResources < cardData.cost) return ValidationError.INSUFFICIENT_RESOURCES

  return null
}

function validateCastSpell(state: GameState, action: Extract<GameAction, { type: ActionType.CAST_SPELL }>): string | null {
  if (state.phase !== Phase.MAIN_PHASE) return ValidationError.WRONG_PHASE

  const player = getPlayer(state, action.playerId)
  const cardInstance = findCardInHand(player, action.cardInstanceId)
  if (!cardInstance) return ValidationError.CARD_NOT_IN_HAND

  const cardData = getCard(cardInstance.cardId)
  if (cardData.type !== CardType.Spell) return ValidationError.WRONG_PHASE

  if (player.temporaryResources < cardData.cost) return ValidationError.INSUFFICIENT_RESOURCES

  return null
}

function validateInfuse(state: GameState, action: Extract<GameAction, { type: ActionType.INFUSE_CARD }>): string | null {
  if (state.phase !== Phase.MAIN_PHASE) return ValidationError.WRONG_PHASE

  const player = getPlayer(state, action.playerId)
  const cardInstance = findCardInHand(player, action.cardInstanceId)
  if (!cardInstance) return ValidationError.CARD_NOT_IN_HAND

  return null
}

function validateActivateAbility(state: GameState, action: Extract<GameAction, { type: ActionType.ACTIVATE_ABILITY }>): string | null {
  if (state.phase !== Phase.MAIN_PHASE) return ValidationError.WRONG_PHASE

  const player = getPlayer(state, action.playerId)
  const unit = findUnitOnBattlefield(player, action.unitInstanceId)
  if (!unit) return ValidationError.INVALID_TARGET
  if (unit.status.silenced) return ValidationError.INVALID_TARGET

  const cardData = getCard(unit.cardId)
  if (cardData.type !== CardType.Unit) return ValidationError.INVALID_TARGET

  const activatedAbilities = (cardData.abilities ?? []).filter(
    (a): a is ActivatedAbility => a.kind === "activated"
  )
  const ability = activatedAbilities[action.abilityIndex]
  if (!ability) return ValidationError.ABILITY_NOT_FOUND

  if (ability.oncePerTurn && unit.abilitiesUsedThisTurn.includes(action.abilityIndex)) {
    return ValidationError.ABILITY_ALREADY_USED
  }
  if (ability.oncePerGame && unit.abilitiesUsedThisGame.includes(action.abilityIndex)) {
    return ValidationError.ABILITY_ALREADY_USED
  }

  if (player.temporaryResources < ability.activationCost) return ValidationError.INSUFFICIENT_RESOURCES

  return null
}

function validateEndMainPhase(state: GameState): string | null {
  if (state.phase !== Phase.MAIN_PHASE) return ValidationError.WRONG_PHASE
  return null
}

function validateEndTurnSelect(state: GameState, action: Extract<GameAction, { type: ActionType.END_TURN_SELECT }>): string | null {
  if (state.phase !== Phase.END_TURN_SELECT) return ValidationError.WRONG_PHASE

  const player = getPlayer(state, action.playerId)

  if (action.keepInstanceIds.length > 2) return ValidationError.INVALID_KEEP_SELECTION

  for (const id of action.keepInstanceIds) {
    if (!findCardInHand(player, id)) return ValidationError.INVALID_KEEP_SELECTION
  }

  return null
}

export function validateAction(state: GameState, action: GameAction): string | null {
  if (!validateTurnOwnership(state, action.playerId)) return ValidationError.NOT_YOUR_TURN

  switch (action.type) {
    case ActionType.SUMMON_UNIT:
      return validateSummonUnit(state, action)
    case ActionType.CAST_SPELL:
      return validateCastSpell(state, action)
    case ActionType.INFUSE_CARD:
      return validateInfuse(state, action)
    case ActionType.ACTIVATE_ABILITY:
      return validateActivateAbility(state, action)
    case ActionType.END_MAIN_PHASE:
      return validateEndMainPhase(state)
    case ActionType.END_TURN_SELECT:
      return validateEndTurnSelect(state, action)
  }
}
