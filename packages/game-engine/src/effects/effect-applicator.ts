import type { GameState, GameEvent, AbilityAction, PlayerId } from "@tcg/shared-types"
import { EffectType, TriggerType } from "@tcg/shared-types"
import { deepCloneState, findUnitOnBattlefield, getOpponentId, getPlayer } from "../utils/state-helpers"
import { checkWinConditions } from "../core/win-condition-checker"
import { destroyUnit } from "../utils/unit-lifecycle"
import { drawCards } from "../phases/draw-system"
import { generateInstanceId } from "../utils/id-generator"
import { getCard } from "@tcg/card-data"

export function applyEffect(
  state: GameState,
  action: AbilityAction,
  trigger: TriggerType,
  sourceInstanceId: string | null,
  sourceOwner: PlayerId,
  resolvedTargetInstanceId: string | undefined,
  resolvedTargetPlayerId: PlayerId | undefined
): { nextState: GameState; events: GameEvent[] } {
  let current = deepCloneState(state)
  const events: GameEvent[] = []

  events.push({
    type: "EFFECT_TRIGGERED",
    trigger,
    sourceInstanceId: sourceInstanceId ?? "",
    effectType: action.type,
  })

  switch (action.type) {
    case EffectType.DEAL_DAMAGE: {
      const value = action.value
      if (resolvedTargetInstanceId) {
        let targetUnit = null
        let targetOwnerId = ""
        for (const [pid, player] of Object.entries(current.players)) {
          const u = findUnitOnBattlefield(player, resolvedTargetInstanceId)
          if (u) { targetUnit = u; targetOwnerId = pid; break }
        }
        if (targetUnit) {
          targetUnit.currentHealth -= value
          events.push({ type: "UNIT_DAMAGED", instanceId: targetUnit.instanceId, damage: value, remainingHealth: targetUnit.currentHealth })
          if (targetUnit.currentHealth <= 0) {
            destroyUnit(current, targetUnit, targetOwnerId, events)
          }
          current = checkWinConditions(current)
        }
      } else if (resolvedTargetPlayerId) {
        const targetPlayer = getPlayer(current, resolvedTargetPlayerId)
        targetPlayer.life -= value
        events.push({ type: "PLAYER_DAMAGED", playerId: resolvedTargetPlayerId, damage: value, remainingLife: targetPlayer.life })
        current = checkWinConditions(current)
      }
      break
    }

    case EffectType.HEAL: {
      const value = action.value
      if (resolvedTargetPlayerId) {
        const targetPlayer = getPlayer(current, resolvedTargetPlayerId)
        targetPlayer.life += value
        events.push({ type: "PLAYER_HEALED", playerId: resolvedTargetPlayerId, amount: value, newLife: targetPlayer.life })
      }
      break
    }

    case EffectType.BUFF_ATTACK: {
      const value = action.value
      if (resolvedTargetInstanceId) {
        for (const player of Object.values(current.players)) {
          const u = findUnitOnBattlefield(player, resolvedTargetInstanceId)
          if (u) {
            u.attack += value
            events.push({ type: "UNIT_BUFFED", instanceId: u.instanceId, attackDelta: value, healthDelta: 0 })
            break
          }
        }
      }
      break
    }

    case EffectType.BUFF_HEALTH: {
      const value = action.value
      if (resolvedTargetInstanceId) {
        for (const player of Object.values(current.players)) {
          const u = findUnitOnBattlefield(player, resolvedTargetInstanceId)
          if (u) {
            u.maxHealth += value
            u.currentHealth += value
            events.push({ type: "UNIT_BUFFED", instanceId: u.instanceId, attackDelta: 0, healthDelta: value })
            break
          }
        }
      }
      break
    }

    case EffectType.DESTROY_UNIT: {
      if (resolvedTargetInstanceId) {
        for (const [pid, player] of Object.entries(current.players)) {
          const u = findUnitOnBattlefield(player, resolvedTargetInstanceId)
          if (u) {
            destroyUnit(current, u, pid, events)
            current = checkWinConditions(current)
            break
          }
        }
      }
      break
    }

    case EffectType.SILENCE: {
      if (resolvedTargetInstanceId) {
        for (const player of Object.values(current.players)) {
          const u = findUnitOnBattlefield(player, resolvedTargetInstanceId)
          if (u) {
            u.keywords = []
            u.status.silenced = true
            break
          }
        }
      }
      break
    }

    case EffectType.DRAW_CARD: {
      const drawResult = drawCards(current, sourceOwner, 1)
      current = drawResult.nextState
      events.push(...drawResult.events)
      break
    }

    case EffectType.SUMMON_TOKEN: {
      throw new Error("SUMMON_TOKEN not implemented in Phase 2")
    }

    case EffectType.REVOLVE_DECK_TOP: {
      const player = getPlayer(current, sourceOwner)
      const count = Math.min(action.value, player.deck.length)
      const cards = player.deck.splice(0, count)
      player.revolvePile.push(...cards)
      if (count > 0) {
        events.push({ type: "DECK_CARDS_REVOLVED", playerId: sourceOwner, count })
      }
      break
    }

    case EffectType.ADD_CARD_TO_HAND: {
      const player = getPlayer(current, sourceOwner)
      const newInstance = {
        instanceId: generateInstanceId(action.cardId),
        cardId: action.cardId,
        owner: sourceOwner,
        primedInfuseCount: 0,
        infuseValueBonus: 0,
      }
      player.hand.push(newInstance)
      events.push({ type: "CARD_ADDED_TO_HAND", playerId: sourceOwner, cardId: action.cardId })
      break
    }

    case EffectType.RETURN_SELF_TO_REVOLVE: {
      if (sourceInstanceId) {
        const player = getPlayer(current, sourceOwner)
        const idx = player.discardPile.findIndex((c) => c.instanceId === sourceInstanceId)
        if (idx !== -1) {
          const card = player.discardPile.splice(idx, 1)[0]!
          player.revolvePile.push(card)
          events.push({ type: "UNIT_RETURNED_TO_REVOLVE", instanceId: sourceInstanceId })
        }
      }
      break
    }

    case EffectType.SEND_REVOLVE_TO_DISCARD: {
      const opponentId = getOpponentId(current, sourceOwner)
      const opponent = getPlayer(current, opponentId)
      if (opponent.revolvePile.length > 0) {
        let lowestCost = Infinity
        let lowestIdx = 0
        for (let i = 0; i < opponent.revolvePile.length; i++) {
          const c = getCard(opponent.revolvePile[i]!.cardId)
          if (c.cost < lowestCost) { lowestCost = c.cost; lowestIdx = i }
        }
        const card = opponent.revolvePile.splice(lowestIdx, 1)[0]!
        opponent.discardPile.push(card)
        events.push({ type: "REVOLVE_CARD_DISCARDED", playerId: opponentId, cardId: card.cardId })
      }
      break
    }

    case EffectType.REVOLVE_TO_DECK: {
      const player = getPlayer(current, sourceOwner)
      const count = Math.min(action.value, player.revolvePile.length)
      const cards = player.revolvePile.splice(0, count)
      player.deck.unshift(...cards)
      if (count > 0) {
        events.push({ type: "REVOLVE_CARDS_TO_DECK", playerId: sourceOwner, count })
      }
      break
    }

    case EffectType.GRANT_ABILITY: {
      if (resolvedTargetInstanceId) {
        for (const player of Object.values(current.players)) {
          const u = findUnitOnBattlefield(player, resolvedTargetInstanceId)
          if (u) {
            u.grantedAbilities.push(action.ability)
            events.push({ type: "ABILITY_GRANTED", unitInstanceId: u.instanceId })
            break
          }
        }
      }
      break
    }
  }

  return { nextState: current, events }
}
