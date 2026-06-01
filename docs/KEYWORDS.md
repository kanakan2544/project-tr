# KEYWORDS.md

# Cyclical TCG — Keyword System

# Purpose

This document defines:

* evergreen gameplay keywords
* keyword behavior
* timing rules
* combat interactions
* implementation expectations

Keywords are designed to be:

* readable
* concise
* tactical
* consistent

The game philosophy prioritizes:

* competitive clarity
* low ambiguity
* board-focused gameplay
* positional strategy

The game intentionally avoids:

* excessive keyword complexity
* verbose text overload
* highly conditional wording

---

# Keyword Design Philosophy

Keywords should:

* communicate gameplay clearly
* be understandable at a glance
* create meaningful tactical decisions
* interact cleanly with lane combat

The game targets:

* LoR-level readability
* MTG-level strategic depth

---

# Ability Categories

The game divides abilities into several categories:

* Static Keywords
* Trigger Positioning
* Trigger Timing
* Activated Abilities
* Game Action Keywords

---

# Static Keywords

Static Keywords are persistent mechanics attached to Units.

They continuously affect combat, targeting, positioning, or gameplay rules while the Unit remains on the field.

---

# Combat Keywords

## Charge

```txt
This Unit can attack during the turn it is summoned.
```

Charge bypasses the Stand By attack restriction.

Charge does NOT:
* grant additional attacks
* bypass lane targeting rules

---

## Quick Attack

```txt
This Unit deals combat damage before its opposing Unit.
```

If the opposing Unit is destroyed before it can retaliate, it does not deal combat damage back.

---

## Double Attack

```txt
This Unit deals combat damage twice during combat.
```

The second attack occurs immediately after the first.

---

## Overkill

```txt
Excess combat damage dealt by this Unit is dealt to the enemy player.
```

Overkill only applies during Unit combat. Overkill does NOT apply to spell damage.

---

## Lifesteal

```txt
Damage dealt by this Unit heals its controller for the same amount.
```

Lifesteal applies to:
* Unit combat damage
* direct player damage

Healing occurs immediately after damage resolution.

---

## Ambush

```txt
Enemy Units cannot attack this Unit directly.
If this Unit is attacked, the attack instead hits the controlling player.
```

---

## Evasion

```txt
This Unit ignores opposing Units when attacking and attacks the enemy player directly.
```

---

## Piercing

```txt
Excess combat damage dealt by this Unit is dealt to the enemy player.
```

Piercing behaves identically to Overkill in combat resolution: when the defending Unit is destroyed and there is remaining damage, that excess is applied to the defending player.

Piercing does NOT apply to spell damage.

---

# Defensive Keywords

## Guard

```txt
Adjacent enemy lanes must attack this Unit first.
```

Guard affects the lane directly left and directly right.

Guard takes priority over Ambush.

If multiple Guards apply, the closest Guard takes priority. If tied, attacker follows normal lane targeting.

---

## Barrier

```txt
Negate the next instance of damage dealt to this Unit.
Barrier is removed after preventing damage.
```

Barrier is initialized as active on summon. Barrier negates combat damage and effect damage alike.

---

## Spellshield

```txt
Negate the first enemy spell or enemy effect that targets this Unit.
Spellshield is removed after activation.
```

Spellshield only blocks targeted enemy effects. Spellshield does NOT block board-wide or non-targeted effects.

---

## Defender

```txt
This Unit cannot attack.
```

---

## Steadfast

```txt
This Unit cannot be moved, displaced, or returned by enemy effects.
```

---

## Silence

```txt
Remove all non-stat abilities and keywords from a Unit.
```

Silence removes: keywords, activated abilities, triggered abilities, passive effects.

Silence does NOT remove: current damage, attack, health, cost.

---

# Trigger Positioning

Trigger Positioning abilities become active depending on board positioning.

## Lonesome

```txt
This effect becomes active while this Unit has no adjacent allied Units.
```

Lonesome is checked at trigger resolution time. If an adjacent ally is present, abilities on a Lonesome unit do not fire.

---

# Trigger Timing

Trigger Timings define when abilities activate.

These are not printed keywords but gameplay timing labels used by effects.

| Timing | When it fires |
|--------|---------------|
| On Summon | Unit enters the battlefield |
| On Death | Unit is destroyed |
| On Attack | Unit begins attacking |
| On Kill | Unit destroys another Unit in combat |
| On Hit | Unit deals damage directly to the enemy player |
| On Revolve | A card is Revolved |
| On Infuse | A card is used for Infuse |
| Start Turn | Start of the controller's turn |
| End Turn | End of the controller's turn |

---

# Activated Abilities

Activated Abilities are manually used by players during their Main Phase.

Unless otherwise specified:
* Activated Abilities may only be used during the controller's Main Phase.
* Activated Abilities cannot be used during combat resolution.

## 1/Turn

```txt
This ability may only be activated once each turn.
```

## 1/Game

```txt
This ability may only be activated once per game.
```

---

# Game Action Keywords

## Revolve

```txt
To Revolve a card, move it to its owner's Revolve Pile.
```

Cards may be Revolved from any zone unless otherwise specified.

## Prime

```txt
A card becomes Primed after fulfilling its Prime condition.
Prime conditions are defined individually on cards.
```

Example:
```txt
Prime 2:
Gain +2/+2.
```

Meaning: this effect becomes active after the card has been Primed twice.

---

# Keyword Formatting Rules

Keywords should:
* appear before effect text
* remain concise
* use standardized wording

Recommended display order:
1. Combat keywords
2. Defensive keywords
3. Trigger Positioning keywords
4. Utility keywords
5. Scaling keywords

---

# Implementation Notes

Keywords map to engine logic:
* `Charge` → clears `standBy` on summon via `applySummonKeywords`
* `QuickAttack` → attacker strikes first in `resolveUnitVsUnit`; no counter if defender dies
* `DoubleAttack` → second strike after first in `resolveLaneCombat`
* `Overkill` → excess damage to defending player in `resolveUnitVsUnit`
* `Lifesteal` → heals controller in `resolveUnitVsUnit` and `resolveDirectAttack`
* `Ambush` → redirects attacker to player in `resolveAttackTarget`
* `Evasion` → always direct attack in `resolveAttackTarget`
* `Guard` → redirects adjacent attacks in `resolveAttackTarget` (priority > Ambush)
* `Barrier` → negates first damage, sets `barrierActive = false` in `resolveUnitVsUnit`
* `Spellshield` → negates first targeted spell/effect, sets `spellshieldActive = false`
* `Defender` → unit skips attack phase in `resolveLaneCombat`
* `Steadfast` → blocks displacement effects (enforced when displacement is implemented)
* `Silence` → sets `silenced = true`, clears `keywords[]` in `effect-applicator`
* `Lonesome` → checked in `effect-trigger-system` before firing triggered abilities

---

# Stand By

```txt
This Unit cannot attack during the turn it enters the battlefield.
```

Stand By is a core game rule, not printed on cards. Charge bypasses Stand By.

---

# Ace / Legendary

* **Ace**: gameplay designation — card begins in Ace Zone, becomes playable after First Revolve.
* **Legendary**: deckbuilding property — eligible to become an Ace.

Neither is a printed keyword.

---

# Future Expansion Keywords

The keyword system is intentionally modular.

Future sets may introduce:
* additional positioning mechanics
* advanced Trigger Conditions
* new Action Keywords
* archetype-specific mechanics
* keyword variants
* advanced Prime interactions
