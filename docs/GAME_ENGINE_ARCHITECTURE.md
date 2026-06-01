# GAME_ENGINE_ARCHITECTURE.md

# Cyclical TCG — Game Engine Architecture

# Purpose

This document defines:

* overall engine philosophy
* multiplayer architecture
* game state structure
* engine responsibilities
* synchronization rules
* implementation standards

The game engine is the:

# authoritative gameplay system

It is responsible for:

* all gameplay rules
* validation
* combat
* sequencing
* state transitions

The frontend should NEVER:

* decide gameplay outcomes
* validate official rules
* calculate official combat results

---

# 1. Core Architecture Philosophy

# React renders.

# Engine decides.

# Colyseus synchronizes.

Responsibilities are strictly separated.

---

# 2. System Overview

```txt id="nrd8f5"
Next.js Client
    ↓
Player Actions
    ↓
Colyseus Room Server
    ↓
Game Engine
    ↓
Updated Game State
    ↓
Synced Back To Clients
```

---

# 3. Frontend Responsibilities

The frontend is responsible for:

* rendering game state
* animations
* visual effects
* sound effects
* UI interactions
* local prediction visuals only

The frontend is NOT responsible for:

* rule validation
* combat calculation
* effect resolution
* authoritative state

---

# 4. Colyseus Responsibilities

Colyseus handles:

* room management
* player connections
* reconnection
* matchmaking
* state synchronization
* multiplayer lifecycle

Colyseus does NOT:

* contain gameplay logic directly

Gameplay logic belongs inside:

# the game engine

---

# 5. Game Engine Responsibilities

The engine handles:

* turn flow
* phase management
* combat
* effect resolution
* targeting validation
* lane validation
* resource handling
* Revolve handling
* Ace legality
* death checks
* deterministic sequencing

---

# 6. Deterministic Design

The engine must always produce:

* identical results from identical inputs

This is critical for:

* multiplayer synchronization
* replay systems
* debugging
* spectators
* anti-cheat

Avoid:

* nondeterministic ordering
* client-side randomness
* async gameplay logic

---

# 7. Recommended Monorepo Structure

```txt id="i4nphd"
/apps
  /web
  /server

/packages
  /game-engine
  /card-data
  /shared-types
```

---

# 8. Game Engine Structure

Recommended structure:

```txt id="t9h0mc"
/packages/game-engine
  /core
  /systems
  /effects
  /validators
  /combat
  /phases
  /utils
```

---

# 9. Core Game State

Recommended root structure:

```ts id="g4v5s1"
type GameState = {
  matchId: string
  turn: number
  activePlayer: PlayerID
  phase: Phase

  players: Record<PlayerID, PlayerState>

  effectQueue: EffectQueueItem[]

  winner?: PlayerID
}
```

---

# 10. Player State Structure

```ts id="q0hcn6"
type PlayerState = {
  id: string

  life: number

  deck: CardInstance[]
  hand: CardInstance[]

  revolvePile: CardInstance[]
  discardPile: CardInstance[]

  battlefield: LaneState[]

  ace?: CardInstance

  revolveCount: number

  temporaryResources: number
}
```

---

# 11. Lane Structure

```ts id="8aqh1l"
type LaneState = {
  index: number
  unit?: UnitInstance
}
```

Default lane count:

* 5

Additional lanes:

* may be added by effects

---

# 12. Unit Instance Structure

```ts id="rm6z4g"
type UnitInstance = {
  instanceId: string

  cardId: string

  owner: PlayerID

  attack: number

  maxHealth: number
  currentHealth: number

  lane: number

  status: {
    standBy: boolean
    exhausted: boolean
  }

  keywords: string[]

  flags: Record<string, boolean>
}
```

---

# 13. Card Instances

Important:

* every physical card instance should have a unique instance ID

Example:

```txt id="dgs3ry"
flame_vanguard#A91X
```

This is required for:

* replay systems
* targeting
* state tracking
* Primed tracking

---

# 14. Turn System

```txt id="cdngl4"
START_TURN
↓
MAIN_PHASE
↓
ATTACK_PHASE
↓
END_TURN
```

The engine controls:

* all phase transitions

---

# 15. Main Phase Flow

During Main Phase:

* validate actions
* resolve effects immediately
* process resource usage

Allowed actions:

* summon
* spell cast
* Infuse
* activate abilities

---

# 16. Attack Phase Flow

Attack Phase resolves automatically.

Units:

* attack from left to right
* must attack if able

Combat flow:

```txt id="8vg7qg"
Validate attacker
↓
Find opposing target
↓
Deal simultaneous damage
↓
Resolve triggers
↓
Check deaths
↓
Proceed to next lane
```

---

# 17. Effect Queue

Although the game has no player-facing stack,
the engine should maintain:

# an internal deterministic effect queue

Purpose:

* ordering consistency
* animation synchronization
* replay support
* debugging

---

# Example

```ts id="0yw1ao"
type EffectQueueItem = {
  source: string
  trigger: string
  effect: EffectData
}
```

---

# 18. Trigger Resolution Rules

Priority order:

1. defending player triggers
2. attacking player triggers
3. left-to-right lane order
4. oldest source first

---

# 19. Resource System

Resources are:

* temporary
* generated through Infuse

At end turn:

```ts id="7b4x5f"
temporaryResources = 0
```

---

# 20. Revolve System

When deck is empty during draw:

```txt id="3f42gt"
Shuffle Revolve Pile
↓
Create new deck
↓
Increment Revolve Count
↓
Resolve ON_REVOLVE triggers
```

---

# 21. Ace Validation

Ace cards:

* begin outside the deck
* become playable after First Revolve

Validation:

```ts id="b1uvjb"
player.revolveCount >= 1
```

---

# 22. Damage Persistence

Damage remains permanently unless healed.

The engine must track:

```ts id="3kx7li"
currentHealth
```

separately from:

```ts id="f87b9v"
maxHealth
```

---

# 23. Death Checking

After:

* combat
* effects
* triggered abilities

The engine must:

* perform death checks

Destroyed Units:

* move to Discard Pile

---

# 24. Fatigue System

If:

* deck empty
* revolvePile empty
* draw required

Player takes:

```txt id="f61fdw"
1 damage per missing draw
```

---

# 25. Serialization Requirements

Game state must remain:

* serializable
* replay-safe
* network-safe

Avoid:

* circular references
* frontend objects
* runtime-only structures

---

# 26. Replay Compatibility

The engine should support future:

# replay systems

Recommended approach:

* store action logs
* replay actions deterministically

Example:

```ts id="8cn85s"
[
  { type: "PLAY_CARD", ... },
  { type: "ATTACK", ... }
]
```

---

# 27. Anti-Cheat Philosophy

The client should never:

* decide legality
* decide combat
* modify official state

Clients only:

* request actions

The server:

* validates everything

---

# 28. Recommended Event Flow

Client sends:

```txt id="57snz7"
PLAY_CARD
INFUSE
ACTIVATE_ABILITY
END_MAIN_PHASE
```

Server responds:

* updated state patches

---

# 29. Animation Philosophy

Animations should NEVER:

* block gameplay logic

Gameplay resolves:

* server-side first

Clients:

* visually represent results afterward

---

# 30. Error Handling

Illegal actions should:

* fail gracefully
* return validation errors
* never corrupt game state

Example:

```ts id="hq5z5g"
{
  success: false,
  reason: "INVALID_TARGET"
}
```

---

# 31. Logging Requirements

Recommended:

* full action logs
* replay logs
* debug combat logs

Useful for:

* balancing
* debugging
* esports integrity

---

# 32. Testing Philosophy

The engine should support:

* unit tests
* deterministic simulations
* bot matches
* replay validation

The engine should be testable:

* without UI
* without networking

---

# 33. Performance Goals

The engine should:

* minimize allocations
* avoid unnecessary recalculations
* minimize network payload size

Gameplay should remain:

* responsive
* scalable
* mobile-compatible

---

# 34. Future-Proofing Goals

Architecture should support future:

* ranked matchmaking
* spectators
* tournaments
* mobile clients
* cosmetics
* new card types
* lane modifications
* additional keywords

---

# 35. Design Philosophy

The engine is designed around:

* deterministic gameplay
* tactical clarity
* server authority
* scalable multiplayer architecture
* low-friction competitive pacing

The engine should remain:

* modular
* maintainable
* extensible
* readable

All gameplay systems should reinforce:

* positional strategy
* resource management
* cyclical progression
