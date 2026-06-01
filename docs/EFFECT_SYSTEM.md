# EFFECT_SYSTEM.md

# Cyclical TCG — Effect System Specification

# Purpose

This document defines:

* gameplay effect architecture
* trigger timing
* targeting rules
* resolution order
* combat timing
* deterministic sequencing

The effect system is one of the most important systems in the game.

It must remain:

* deterministic
* readable
* scalable
* multiplayer-safe
* data-driven

---

# 1. Core Philosophy

The game uses:

# immediate resolution

The game does NOT use:

* a stack system
* interrupt chains
* reaction windows
* instant-speed responses

Effects resolve:

* immediately when activated
* immediately when triggered

This keeps gameplay:

* readable
* fast
* low-friction
* competitive

---

# 2. Resolution Philosophy

When an action occurs:

1. validate legality
2. execute the action
3. resolve triggered effects
4. apply state changes
5. check deaths
6. continue game flow

---

# 3. Deterministic Gameplay

The game strongly minimizes:

* randomness
* hidden calculations
* ambiguous outcomes

Most effects should:

* target explicitly
* resolve predictably
* produce consistent results

---

# 4. Trigger Types

Effects may trigger from:

```txt id="e1zh5z"
ON_PLAY
ON_SUMMON
ON_ATTACK
ON_DAMAGE
ON_DESTROY
ON_INFUSE
ON_REVOLVE
START_TURN
END_TURN
```

Additional triggers may be added later.

---

# 5. Trigger Timing Rules

# Immediate Trigger Rule

When a trigger condition is met:

* its effect resolves immediately

Example:

```txt id="x04g6u"
A Unit is summoned
↓
ON_SUMMON triggers immediately
```

---

# No Delayed Stack

Effects do NOT wait in a response queue.

Players cannot:

* respond to effects
* chain effects
* interrupt resolution

---

# 6. Action Legality

Before resolving any action, the engine must validate:

* turn ownership
* timing legality
* resource availability
* targeting legality
* lane legality
* activation restrictions

Illegal actions:

* fail immediately
* do not partially resolve

---

# 7. Combat System Timing

# Attack Phase Flow

All Units:

* must attack if able

Attacks resolve:

* from left to right

---

# Example

```txt id="1cjlwm"
Lane 1
↓
Lane 2
↓
Lane 3
↓
Lane 4
↓
Lane 5
```

---

# Attack Targeting

A Unit attacks:

* the opposing Unit in the same lane

If no opposing Unit exists:

* attack the opposing player directly

---

# 8. Simultaneous Damage

Combat damage is dealt:

# simultaneously

Example:

```txt id="pvhf58"
4/4 attacks 3/5

Result:
Attacker becomes 4/1
Defender becomes 3/1
```

If lethal damage occurs simultaneously:

* both Units are destroyed

---

# 9. Persistent Damage

Damage remains on Units permanently unless healed.

The engine must:

* track current health separately from maximum health

Example:

```json id="gyx0ib"
{
  "attack": 4,
  "maxHealth": 5,
  "currentHealth": 2
}
```

---

# 10. Combat Trigger Priority

If combat triggers occur simultaneously:

1. defending Unit effects resolve first
2. attacking Unit effects resolve second

---

# Example

```txt id="1l4g2s"
Defender:
"Deal 1 damage when damaged"

Attacker:
"Gain +1 attack when attacking"
```

Defender effect resolves first.

---

# 11. Death Resolution

After effects resolve:

* check all Units for lethal damage

A Unit is destroyed when:

```txt id="l1xzj4"
currentHealth <= 0
```

Destroyed Units:

* are sent to the Discard Pile

---

# 12. Simultaneous Death

If multiple Units die simultaneously:

* all are destroyed simultaneously

Then:

* all ON_DESTROY effects resolve

---

# 13. Trigger Ordering

When multiple triggers occur simultaneously:

# Priority Order

1. defending player effects
2. attacking player effects
3. left-to-right lane order
4. oldest effect source first

This ensures:

* deterministic multiplayer synchronization
* replay consistency

---

# 14. Spell Resolution

Current spell type:

# Normal Spell

Normal Spell flow:

1. validate targets
2. pay costs
3. resolve effects immediately
4. send spell to Discard Pile

---

# 15. Activated Abilities

Activated abilities:

* may only be used during Main Phase
* follow listed restrictions

Possible restrictions:

* once per turn
* resource cost
* specific targeting rules

---

# Example

```json id="aj1ywv"
{
  "name": "Flame Surge",
  "cost": 2,
  "oncePerTurn": true
}
```

---

# 16. Infuse Timing

When a card is Infused:

1. generate resources immediately
2. move card to Revolve Pile
3. resolve ON_INFUSE effects

---

# 17. Revolve Timing

When a player must draw from an empty deck:

1. shuffle Revolve Pile
2. create new deck
3. increment Revolve count
4. resolve ON_REVOLVE effects

---

# 18. Ace Timing

Ace cards:

* begin in Ace Zone
* become playable after First Revolve

The engine must validate:

* Revolve count before allowing Ace play

Ace cards:

* still require normal cost payment

---

# 19. Stand By Timing

When a Unit enters the battlefield:

* it enters Stand By

Units in Stand By:

* cannot attack during that turn

At the start of their controller's next turn:

* Stand By is removed

---

# 20. Phase Restrictions

# Main Phase Only

The following may only occur during Main Phase:

* summoning
* casting spells
* activating abilities
* Infusing cards

---

# Attack Phase Restrictions

During Attack Phase:

* attacks resolve automatically
* no spells may be cast
* no abilities may be activated

---

# 21. Lane Validation

Units may only:

* occupy empty lanes

The engine must validate:

* lane availability before summoning

---

# 22. Direct Attack Validation

A Unit may attack the opposing player only if:

* the opposing lane is empty

Other enemy Units:

* do not prevent direct attacks

---

# 23. Fatigue Damage

If a player must draw while:

* deck is empty
* Revolve Pile is empty

That player takes:

* 1 damage per missing draw

Fatigue damage:

* resolves immediately

---

# 24. Target Validation

Effects must validate:

* target existence
* target legality
* target ownership
* lane restrictions

Invalid targets:

* cause the effect to fail

---

# 25. Public Information Rules

Public:

* battlefield
* discard piles
* Revolve Piles
* Life totals
* lane positions

Hidden:

* hands
* deck order

---

# 26. Randomness Rules

The game minimizes:

* random targeting
* random outcomes
* random generation

Preferred design:

* targeted effects
* visible information
* player agency

---

# 27. Effect Queue Philosophy

Although the game has no player-response stack,
the engine should still internally use:

# a deterministic effect queue

Purpose:

* maintain ordering consistency
* support animations
* support multiplayer sync
* support replay systems

This queue is:

* internal only
* not interactable by players

---

# 28. Engine Responsibilities

The engine is responsible for:

* validation
* sequencing
* trigger resolution
* death checks
* combat resolution
* deterministic ordering

The client is responsible only for:

* rendering
* animations
* UI interactions

---

# 29. Serialization Requirements

All effects must remain:

* serializable
* replay-safe
* deterministic

Effects should avoid:

* hidden client-side calculations
* nondeterministic logic

---

# 30. Design Philosophy

The effect system is designed to create:

* tactical clarity
* strategic depth
* consistent outcomes
* readable interactions

The game intentionally avoids:

* excessive timing windows
* hidden interaction chains
* complicated interrupt systems
* unintuitive resolution rules

Every effect should support:

* fast competitive pacing
* positional gameplay
* resource decision making
* cyclical progression

---

# Phase 8 Additions

## New EffectTypes

| Type | Description |
|------|-------------|
| `REVOLVE_DECK_TOP` | Move top N cards from controller's deck → revolve pile. No revolveCount increment. |
| `ADD_CARD_TO_HAND` | Add a fresh copy of `cardId` to controller's hand. |
| `RETURN_SELF_TO_REVOLVE` | ON_DESTROY only: move this unit's CardInstance from discard → revolve pile. |
| `SEND_REVOLVE_TO_DISCARD` | Move the lowest-cost card in the opponent's revolve pile to their discard pile. |
| `REVOLVE_TO_DECK` | Move first N cards from controller's revolve pile to the top of their deck. |
| `GRANT_ABILITY` | Grant a `TriggeredAbility` to the target unit at runtime. Stored in `unit.grantedAbilities[]`. |

## New TargetType

| Type | Description |
|------|-------------|
| `ALL_ALLY_UNITS` | All units on the controller's side of the battlefield. |

## New EffectConditionType

| Type | Description |
|------|-------------|
| `CONTROLS_X_UNITS` | Condition passes when the ability's controller has ≥ `value` units on the battlefield. |

## Aura System

Units with an `aura` field emit a passive bonus to adjacent allies. `recomputeAuras(state)` is called after every dispatch and after each lane in combat. Bonuses are tracked in `unit.flags.auraAttack` to ensure idempotency — old value is subtracted before reapplying.
