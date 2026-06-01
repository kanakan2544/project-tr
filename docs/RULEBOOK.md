# RULEBOOK.md

# Cyclical TCG — Official Rulebook

# 1. Objective

Reduce your opponent's Life to 0.

A player also loses if:

* they must draw cards
* their deck is empty
* their Revolve Pile is empty
* and they cannot complete the required draw

That player takes:

* 1 damage per missing draw

If both players lose simultaneously:

* the match ends in a draw

---

# 2. Game Components

Each player has:

* 1 Main Deck
* 1 Ace Card
* 1 Ace Zone
* 1 Revolve Pile
* 1 Discard Pile
* 1 Battlefield
* 1 Hand

---

# 3. Deck Construction

# Main Deck Rules

* exactly 30 cards
* maximum 2 copies of the same card

---

# Ace Rules

Each player selects:

* 1 Legendary card as their Ace

The Ace:

* begins outside the deck
* starts in the Ace Zone

Legendary cards may still:

* be included in the Main Deck normally

---

# Class Restrictions

A deck may only contain:

* cards matching the Ace's class
* Neutral cards

---

# 4. Battlefield Layout

Each player controls:

* 5 lanes

Example:

```txt id="6m18q4"
[1] [2] [3] [4] [5]
```

Each lane may contain:

* 1 Unit

A lane is considered:

* occupied if it contains a Unit
* empty if it contains no Unit

Some card effects may:

* create additional lanes

These effects are intended to be rare.

---

# 5. Starting the Game

# Setup

1. Both players shuffle their decks
2. Both players draw 5 cards
3. Determine the starting player randomly

---

# Mulligan

Each player may:

* return any number of cards from their hand into their deck
* shuffle the deck
* draw the same number of cards

---

# Second Player Bonus

After mulligans:

* the second player draws 1 additional card

---

# Starting Life

Each player begins with:

* 25 Life

---

# 6. Turn Structure

Each turn follows this order:

```txt id="t24z83"
Start Turn
↓
Main Phase
↓
Attack Phase
↓
End Turn
```

---

# 7. Start Turn

During Start Turn:

* resolve all start-of-turn effects

Players do NOT draw cards during Start Turn.

---

# 8. Main Phase

During Main Phase, the active player may:

* summon Units
* cast Spells
* activate Unit abilities
* Infuse cards for resources

The player may perform actions:

* in any order
* any number of times if legal

---

# 9. Resource System

# Infuse

To generate resources:

* a player Infuses cards from their hand

Each card has:

* an Infuse Value

The total Infuse Value generated is used to:

* pay card costs
* activate abilities

---

# Infused Cards

Infused cards are placed into the:

* Revolve Pile

---

# Resource Rules

Resources:

* exist only during the current turn
* do not carry over between turns

Unused resources are lost:

* at the end of the turn

---

# 10. Playing Cards

To play a card:

1. Declare the card
2. Pay its cost by Infusing cards
3. Resolve the card effect
4. Place the card appropriately

---

# Units

Units:

* enter an empty lane
* remain on the battlefield until removed

Units cannot be summoned:

* into occupied lanes

---

# Spells

Current spell type:

* Normal Spell

Normal Spells:

* resolve immediately
* are then placed into the Discard Pile

---

# 11. Stand By

When a Unit enters the battlefield:

* it enters Stand By

Units in Stand By:

* cannot attack during that turn

On their controller's next turn:

* they may attack normally

---

# 12. Combat Rules

# Attack Phase Overview

During the Attack Phase:

* all Units must attack if able

Attacks resolve:

* from left to right

---

# Attack Targeting

A Unit attacks:

* the opposing Unit in the same lane

If no opposing Unit exists:

* the attack hits the opposing player directly

Units cannot:

* freely choose different lanes to attack

---

# Simultaneous Damage

Combat damage is dealt:

* simultaneously

If both Units receive lethal damage:

* both Units are destroyed

---

# Damage Persistence

Damage remains on Units permanently unless healed.

Example:

* a damaged Unit stays damaged across turns

---

# Destroyed Units

When a Unit is destroyed:

* send it to the Discard Pile

---

# Combat Trigger Timing

If combat effects trigger simultaneously:

1. defending Unit effects resolve first
2. attacking Unit effects resolve second

---

# 13. Unit Abilities

Some Units may contain:

* activated abilities

Activated abilities:

* may only be used during Main Phase
* follow their listed restrictions

Abilities may include:

* once per turn limitations
* resource costs
* unlimited activations if allowed

---

# 14. Revolve System

# Revolve Pile

Cards placed into the Revolve Pile include:

* Infused cards
* cards specifically moved there by effects

---

# Revolve

When a player must draw from an empty deck:

1. shuffle the Revolve Pile
2. create a new deck from it
3. increase that player's Revolve count by 1

This process is called:

# Revolve

---

# Empty Revolve Pile

If both:

* the deck
* and Revolve Pile

are empty when drawing is required:

* the player takes fatigue damage instead

---

# 15. Primed

Some cards may become:

# Primed

after meeting specific conditions.

Common Primed conditions include:

* being Infused
* multiple Revolves
* repeated cycling

Primed cards may gain:

* stronger stats
* upgraded abilities
* additional effects

---

# 16. Ace Rules

# Ace Zone

Each player's Ace begins:

* outside the Main Deck
* inside the Ace Zone

---

# Ace Availability

The Ace becomes playable:

* after the player's First Revolve

The Ace still requires:

* paying its normal cost

---

# Ace Removal

If an Ace leaves the battlefield:

* place it into the Discard Pile

It does NOT automatically:

* return to the Ace Zone

---

# 17. Public & Hidden Information

# Public Information

The following are public:

* battlefield
* discard piles
* Revolve Piles
* Life totals
* Revolve counts

---

# Hidden Information

The following are hidden:

* player hands
* deck order

---

# 18. Randomness Philosophy

The game is designed around:

* low randomness
* player agency
* deterministic gameplay

Most effects:

* directly target
* clearly specify targets
* avoid excessive random outcomes

---

# 19. Targeting Rules

Effects may target:

* players
* Units
* specific lanes
* all Units

If an effect has targeting restrictions:

* the card text explicitly states them

---

# 20. Match Pace Philosophy

The game is designed for:

* fast competitive matches
* meaningful decision making
* low downtime

Target match duration:

* ideally under 10 minutes
* maximum around 15 minutes
