import type {
  GameAction,
  GameState,
  CardInstance,
  UnitInstance,
  ActivatedAbility,
} from "@tcg/shared-types"
import {
  ActionType,
  CardType,
  Phase,
  TargetType,
  TriggerType,
} from "@tcg/shared-types"
import { getCard } from "@tcg/card-data"
import type { TriggeredAbility } from "@tcg/shared-types"

function getOpponentId(state: GameState, playerId: string): string {
  const ids = Object.keys(state.players)
  const opp = ids.find((id) => id !== playerId)
  if (!opp) throw new Error("Opponent not found")
  return opp
}

function generateSummonActions(state: GameState, playerId: string): GameAction[] {
  const actions: GameAction[] = []
  const player = state.players[playerId]!

  const candidates: CardInstance[] = [...player.hand]
  if (player.ace && player.revolveCount >= 1) {
    candidates.push(player.ace)
  }

  for (const card of candidates) {
    const cardData = getCard(card.cardId)
    if (cardData.type !== CardType.Unit) continue
    if (player.temporaryResources < cardData.cost) continue

    for (let lane = 0; lane < 5; lane++) {
      if (player.battlefield[lane]?.unit === null) {
        actions.push({
          type: ActionType.SUMMON_UNIT,
          playerId,
          cardInstanceId: card.instanceId,
          targetLane: lane,
        })
      }
    }
  }
  return actions
}

function generateSpellActions(state: GameState, playerId: string): GameAction[] {
  const actions: GameAction[] = []
  const player = state.players[playerId]!
  const opponentId = getOpponentId(state, playerId)
  const opponent = state.players[opponentId]!

  for (const card of player.hand) {
    const cardData = getCard(card.cardId)
    if (cardData.type !== CardType.Spell) continue
    if (player.temporaryResources < cardData.cost) continue

    const onPlayAbility = (cardData.abilities ?? []).find(
      (a): a is TriggeredAbility => a.kind === "triggered" && a.trigger === TriggerType.ON_PLAY
    )

    if (!onPlayAbility) {
      actions.push({ type: ActionType.CAST_SPELL, playerId, cardInstanceId: card.instanceId })
      continue
    }

    const firstActionTarget = onPlayAbility.actions[0] && "target" in onPlayAbility.actions[0]
      ? onPlayAbility.actions[0].target
      : undefined

    switch (firstActionTarget) {
      case TargetType.ENEMY_UNIT:
      case TargetType.ANY_UNIT: {
        for (const lane of opponent.battlefield) {
          if (lane.unit) {
            actions.push({
              type: ActionType.CAST_SPELL,
              playerId,
              cardInstanceId: card.instanceId,
              targetInstanceId: lane.unit.instanceId,
            })
          }
        }
        break
      }
      case TargetType.ALLY_UNIT: {
        for (const lane of player.battlefield) {
          if (lane.unit) {
            actions.push({
              type: ActionType.CAST_SPELL,
              playerId,
              cardInstanceId: card.instanceId,
              targetInstanceId: lane.unit.instanceId,
            })
          }
        }
        break
      }
      case TargetType.ALLY_PLAYER: {
        actions.push({
          type: ActionType.CAST_SPELL,
          playerId,
          cardInstanceId: card.instanceId,
          targetPlayerId: playerId,
        })
        break
      }
      case TargetType.ENEMY_PLAYER: {
        actions.push({
          type: ActionType.CAST_SPELL,
          playerId,
          cardInstanceId: card.instanceId,
          targetPlayerId: opponentId,
        })
        break
      }
      default: {
        actions.push({ type: ActionType.CAST_SPELL, playerId, cardInstanceId: card.instanceId })
      }
    }
  }
  return actions
}

function generateAbilityActions(
  state: GameState,
  playerId: string,
  unit: UnitInstance,
  ability: ActivatedAbility,
  abilityIndex: number
): GameAction[] {
  const base = {
    type: ActionType.ACTIVATE_ABILITY as const,
    playerId,
    unitInstanceId: unit.instanceId,
    abilityIndex,
  }

  const opponentId = getOpponentId(state, playerId)
  const opponent = state.players[opponentId]!
  const player = state.players[playerId]!

  const firstActionTarget = ability.actions[0] && "target" in ability.actions[0]
    ? ability.actions[0].target
    : undefined

  switch (firstActionTarget) {
    case TargetType.ENEMY_UNIT:
    case TargetType.ANY_UNIT: {
      return opponent.battlefield
        .filter((l) => l.unit !== null)
        .map((l) => ({ ...base, targetInstanceId: l.unit!.instanceId }))
    }
    case TargetType.ALLY_UNIT: {
      return player.battlefield
        .filter((l) => l.unit !== null)
        .map((l) => ({ ...base, targetInstanceId: l.unit!.instanceId }))
    }
    default:
      return [base]
  }
}

function generateActivateAbilityActions(state: GameState, playerId: string): GameAction[] {
  const actions: GameAction[] = []
  const player = state.players[playerId]!

  for (const lane of player.battlefield) {
    const unit = lane.unit
    if (!unit) continue
    if (unit.status.silenced) continue

    const cardData = getCard(unit.cardId)
    if (cardData.type !== CardType.Unit) continue

    const activatedAbilities = (cardData.abilities ?? [])
      .map((a, _globalIndex) => a)
      .filter((a): a is ActivatedAbility => a.kind === "activated")

    for (let i = 0; i < activatedAbilities.length; i++) {
      const ability = activatedAbilities[i]!
      if (player.temporaryResources < ability.activationCost) continue
      if (ability.oncePerTurn && unit.abilitiesUsedThisTurn.includes(i)) continue
      actions.push(...generateAbilityActions(state, playerId, unit, ability, i))
    }
  }
  return actions
}

function generateInfuseActions(state: GameState, playerId: string): GameAction[] {
  const player = state.players[playerId]!
  return player.hand.map((card) => ({
    type: ActionType.INFUSE_CARD as const,
    playerId,
    cardInstanceId: card.instanceId,
  }))
}

function generateEndTurnSelectAction(state: GameState, playerId: string): GameAction {
  const player = state.players[playerId]!
  const sorted = [...player.hand].sort((a, b) => {
    const ca = getCard(a.cardId)
    const cb = getCard(b.cardId)
    return cb.cost - ca.cost
  })
  const keepInstanceIds = sorted.slice(0, 2).map((c) => c.instanceId)
  return { type: ActionType.END_TURN_SELECT, playerId, keepInstanceIds }
}

export function generateValidActions(state: GameState, playerId: string): GameAction[] {
  if (state.activePlayer !== playerId) return []

  if (state.phase === Phase.END_TURN_SELECT) {
    return [generateEndTurnSelectAction(state, playerId)]
  }

  if (state.phase !== Phase.MAIN_PHASE) return []

  return [
    ...generateSummonActions(state, playerId),
    ...generateSpellActions(state, playerId),
    ...generateActivateAbilityActions(state, playerId),
    ...generateInfuseActions(state, playerId),
    { type: ActionType.END_MAIN_PHASE, playerId },
  ]
}
