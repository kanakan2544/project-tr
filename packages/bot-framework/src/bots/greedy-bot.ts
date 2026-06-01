import type { GameAction, GameState } from "@tcg/shared-types"
import { ActionType, CardType, Keyword, Phase } from "@tcg/shared-types"
import type { BotPlayer } from "./bot-interface"
import { generateValidActions } from "./action-generator"
import { getCard } from "@tcg/card-data"
import type { UnitCardData } from "@tcg/shared-types"

export class GreedyBot implements BotPlayer {
  readonly name = "GreedyBot"

  selectAction(state: GameState, playerId: string): GameAction {
    const actions = generateValidActions(state, playerId)

    if (actions.length === 0) {
      return { type: ActionType.END_MAIN_PHASE, playerId }
    }

    // Handle END_TURN_SELECT phase immediately
    if (state.phase === Phase.END_TURN_SELECT) {
      return actions[0]!
    }

    // 1. Summon: pick highest-attack unit (prefer Dash)
    const summons = actions.filter((a) => a.type === ActionType.SUMMON_UNIT)
    if (summons.length > 0) {
      const best = summons.reduce((prev, curr) => {
        if (curr.type !== ActionType.SUMMON_UNIT || prev.type !== ActionType.SUMMON_UNIT) return prev
        const cd = getCard(state.players[playerId]!.hand.find(
          (c) => c.instanceId === curr.cardInstanceId
        )?.cardId ?? state.players[playerId]!.ace?.cardId ?? "") as UnitCardData | undefined
        const pd = getCard(state.players[playerId]!.hand.find(
          (c) => c.instanceId === prev.cardInstanceId
        )?.cardId ?? state.players[playerId]!.ace?.cardId ?? "") as UnitCardData | undefined
        if (!cd || !pd) return prev
        const cScore = cd.attack + ((cd.keywords ?? []).includes(Keyword.Charge) ? 2 : 0)
        const pScore = pd.attack + ((pd.keywords ?? []).includes(Keyword.Charge) ? 2 : 0)
        return cScore > pScore ? curr : prev
      })
      if (best.type === ActionType.SUMMON_UNIT) return best
    }

    // 2. Cast spell
    const spells = actions.filter((a) => a.type === ActionType.CAST_SPELL)
    if (spells.length > 0) return spells[0]!

    // 3. Activate ability
    const abilities = actions.filter((a) => a.type === ActionType.ACTIVATE_ABILITY)
    if (abilities.length > 0) return abilities[0]!

    // 4. Infuse cheapest card
    const infuses = actions.filter((a) => a.type === ActionType.INFUSE_CARD)
    if (infuses.length > 0) {
      return infuses.reduce((prev, curr) => {
        if (curr.type !== ActionType.INFUSE_CARD || prev.type !== ActionType.INFUSE_CARD) return prev
        const cc = getCard(state.players[playerId]!.hand.find(
          (c) => c.instanceId === curr.cardInstanceId
        )?.cardId ?? "")
        const pc = getCard(state.players[playerId]!.hand.find(
          (c) => c.instanceId === prev.cardInstanceId
        )?.cardId ?? "")
        return cc.cost < pc.cost ? curr : prev
      })
    }

    // 5. End turn
    return { type: ActionType.END_MAIN_PHASE, playerId }
  }
}
