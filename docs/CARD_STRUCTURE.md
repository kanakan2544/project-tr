# CARD_STRUCTURE.md

# Cyclical TCG — Card Structure Specification

## Purpose

This document defines the card data architecture across three separated concerns:

| Concern | Type | Location |
|---|---|---|
| Gameplay | `CardDefinition` | `@tcg/shared-types` + `@tcg/card-data` |
| Localization | `CardLocale` JSON | `packages/card-data/src/locales/en.json` |
| Presentation | `PresentationData` | `packages/card-data/src/presentation.ts` |

The game engine reads only `CardDefinition`. Frontend reads locale and presentation separately.

---

## 1. Card Categories

Current categories:

* Unit — has `attack`, `health`, `keywords`
* Spell — has `spellType`

---

## 2. CardDefinition — Gameplay Fields Only

`CardDefinition` contains **no** player-facing text, no art references, no flavor.

Example — simple unit:

```ts
{
  id: "flame_vanguard",
  type: CardType.Unit,
  cost: 3,
  infuse: 2,
  attack: 4,
  health: 3,
  keywords: [Keyword.Dash],
  metadata: { rarity: Rarity.Rare, class: CardClass.Warrior },
}
```

Example — spell with ability:

```ts
{
  id: "quick_strike",
  type: CardType.Spell,
  spellType: SpellType.Normal,
  cost: 2,
  infuse: 1,
  metadata: { rarity: Rarity.Common, class: CardClass.Warrior },
  abilities: [
    {
      kind: "triggered",
      trigger: TriggerType.ON_PLAY,
      actions: [{ type: EffectType.DEAL_DAMAGE, target: TargetType.ENEMY_UNIT, value: 2 }],
    },
  ],
}
```

---

## 3. Universal Fields

### id

```ts
id: "flame_vanguard"
```

* unique, lowercase, snake_case
* immutable after release
* used for gameplay, networking, deck serialization, replay

### type

`CardType.Unit` or `CardType.Spell`

### cost

Resources required to play. Generated through Infuse.

### infuse

```ts
infuse: 2
```

Resource generated when this card is Infused.

### metadata

```ts
metadata: { rarity: Rarity.Rare, class: CardClass.Warrior }
```

Contains `rarity`, `class`, and optionally `isLegendary: true`. Not used by the game engine — used for collection/deckbuilding UI.

---

## 4. Unit-Only Fields

```ts
attack: number
health: number
keywords?: readonly Keyword[]
primedCondition?: PrimedCondition
primedStats?: { attack?: number; health?: number }
```

### primedCondition + primedStats

Defines when a unit becomes Primed and what stat change applies at that moment.

```ts
primedCondition: { type: PrimedConditionType.INFUSED_X_TIMES, value: 2 }
primedStats: { attack: 2, health: 2 }
```

---

## 5. Abilities

`abilities[]` unifies triggered and activated abilities via a `kind` discriminant.

### Triggered Ability

Fires automatically when a trigger event occurs.

```ts
{
  kind: "triggered",
  trigger: TriggerType.ON_ATTACK,
  actions: [{ type: EffectType.BUFF_ATTACK, target: TargetType.SELF, value: 1 }],
}
```

Optionally scoped to a condition:

```ts
{
  kind: "triggered",
  trigger: TriggerType.ON_SUMMON,
  conditions: [{ type: EffectConditionType.SELF_IS_PRIMED }],
  actions: [{ type: EffectType.BUFF_ATTACK, target: TargetType.SELF, value: 1 }],
}
```

### Activated Ability

Manually used by the player during Main Phase.

```ts
{
  kind: "activated",
  activationCost: 2,
  oncePerTurn: true,
  displayName: "Channel Storm",
  actions: [{ type: EffectType.DEAL_DAMAGE, target: TargetType.ENEMY_PLAYER, value: 2 }],
}
```

`displayName` is for Card Editor UI only. The engine identifies activated abilities by **index** (`abilityIndex: number`) — the 0-based position within the filtered `kind === "activated"` sub-array.

### AbilityAction — Discriminated Union

```ts
type AbilityAction =
  | { type: EffectType.DEAL_DAMAGE;  target: TargetType; value: number }
  | { type: EffectType.HEAL;          target: TargetType; value: number }
  | { type: EffectType.BUFF_ATTACK;  target: TargetType; value: number }
  | { type: EffectType.BUFF_HEALTH;  target: TargetType; value: number }
  | { type: EffectType.DESTROY_UNIT; target: TargetType }
  | { type: EffectType.SILENCE;       target: TargetType }
  | { type: EffectType.DRAW_CARD }
  | { type: EffectType.SUMMON_TOKEN; target: TargetType; value?: number }
  | { type: EffectType.REVOLVE_DECK_TOP; value: number }            // move top N deck cards → revolve pile
  | { type: EffectType.ADD_CARD_TO_HAND; cardId: string }           // add a card copy to owner's hand
  | { type: EffectType.RETURN_SELF_TO_REVOLVE }                     // ON_DESTROY only: move self to revolve pile
  | { type: EffectType.SEND_REVOLVE_TO_DISCARD }                    // lowest-cost card in opponent revolve → discard
  | { type: EffectType.REVOLVE_TO_DECK; value: number }             // move first N revolve cards to top of deck
  | { type: EffectType.GRANT_ABILITY; target: TargetType; ability: TriggeredAbility }  // grant runtime ability
```

### Phase 8 additions — UnitCardDefinition extended fields

```ts
// Optional: conditional keyword/stat bonuses triggered by primed condition (revolveCount or infuse count)
readonly primedKeywords?: readonly Keyword[]   // keywords gained when unit becomes primed
readonly primedStats?: { attack?: number; health?: number }  // stat delta when primed (existing, added Phase 1)

// Optional: unit aura affecting adjacent allies each turn
readonly aura?: {
  scope: "ADJACENT_ALLIES"
  attack?: number       // flat attack bonus per tick
  perRevolve?: boolean  // if true, bonus = attack * revolveCount
}
```

### Phase 8 additions — UnitInstance state

```ts
grantedAbilities: TriggeredAbility[]  // runtime-granted abilities (e.g. from Cross the Line)
```

---

## 6. Trigger Types

```
ON_PLAY     — spell resolves / unit enters play
ON_SUMMON   — unit placed on battlefield
ON_ATTACK   — unit attacks
ON_DAMAGE   — unit receives damage
ON_DESTROY  — unit is destroyed
ON_INFUSE   — card is infused
ON_REVOLVE  — card enters revolve pile
START_TURN  — turn begins
END_TURN    — turn ends
```

---

## 7. Target Types

```
SELF
ALLY_UNIT
ENEMY_UNIT
ANY_UNIT
ALL_UNITS
ALL_ENEMY_UNITS
ALL_ALLY_UNITS   — all units owned by the ability's controller (Phase 8)
ALLY_PLAYER
ENEMY_PLAYER
OPPOSING_UNIT    — used in lane combat only
```

---

## 8. Localization

Card text lives in `packages/card-data/src/locales/en.json`, not in `CardDefinition`.

```json
{
  "flame_vanguard": {
    "name": "Flame Vanguard",
    "text": "ON_SUMMON: This unit gains Rush.",
    "flavorText": "The first to charge, the last to fall."
  }
}
```

Frontend fetches via:

```ts
import { getCardLocale } from "@tcg/card-data"
const locale = getCardLocale("en", card.id)
// locale.name, locale.text, locale.flavorText
```

Gameplay logic NEVER reads localized text.

---

## 9. Presentation

Art, SFX, VFX, voice, and animation data live in `packages/card-data/src/presentation.ts`:

```ts
export const presentationRegistry: Record<string, PresentationData> = {}
```

`PresentationData` structure:

```ts
interface PresentationData {
  artId?: string
  sfx?: { summon?: string; attack?: string; death?: string }
  vfx?: { summon?: string; attack?: string }
  voice?: { summon?: string }
  animation?: { summon?: string; idle?: string }
}
```

Populated by the Card Editor (Phase 8). Never read by the game engine.

---

## 10. Keywords

Keywords are inline on `UnitCardDefinition.keywords[]` and processed by `keyword-resolver.ts` in the engine.

See `docs/KEYWORDS.md` for definitions.

---

## 11. Ace-Compatible Cards

```ts
metadata: { rarity: Rarity.Legendary, class: CardClass.Warrior, isLegendary: true }
```

Legendary cards may also be selected as Ace cards. Ace slot logic is in game state, not the card definition.

---

## 12. Serialization Requirements

All `CardDefinition` fields must be:

* serializable (no functions, no class instances)
* deterministic
* network-safe

Required for multiplayer sync, replay, spectator, and match recovery.

---

## 13. Design Philosophy

Cards define **data**. The engine defines **rules**.

Cards should:
* create meaningful decisions
* interact cleanly with the Revolve/Infuse loop
* remain readable (keyword-forward, low text density)

Avoid:
* hardcoded UI logic in card data
* ambiguous targeting
* hidden or exception-based behavior
