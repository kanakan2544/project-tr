# ROADMAP.md

# Cyclical TCG — Development Roadmap

# Vision

The project aims to build:

* a competitive online PvP card game
* with deterministic tactical gameplay
* low randomness
* cyclical resource progression
* fast match pacing
* and future roguelike progression systems

The long-term vision includes:

* PvP matchmaking
* PvE roguelike campaigns
* school-life progression systems
* hidden relationship/stat systems
* evolving encounters
* replay & spectator systems

However:

# the primary focus is stabilizing the core card game first

---

# Core Development Philosophy

Priority order:

```txt id="cgjll6"
Gameplay correctness
↓
Deterministic engine
↓
Testing tools
↓
Multiplayer
↓
UI polish
↓
Meta systems
↓
PvE/Roguelike systems
```

The project should avoid:

* premature polish
* early cosmetics
* early monetization systems
* feature creep before engine stability

---

# Technology Stack

Frontend:

* Next.js
* React
* TypeScript
* TailwindCSS
* Framer Motion

Backend:

* Node.js
* Colyseus
* PostgreSQL

Architecture:

* authoritative server
* deterministic game engine
* websocket multiplayer synchronization

---

# Long-Term Product Structure

The game will eventually contain two major modes:

# 1. Competitive PvP

* friend matches
* BO1
* BO3
* ranked support in future
* replay support
* spectator support

# 2. PvE Roguelike Academy Mode

Inspired by:

* Inscryption
* Slay the Spire
* Yu-Gi-Oh! GX

Features:

* academy progression
* daily schedules
* encounters
* hidden variables
* card shop
* exams
* evolving narrative routes
* possible PvP duel encounters

This mode is NOT the current development priority.

---

# PHASE 1 — Core Engine Foundation

# Goal

Build the deterministic gameplay engine.

# Features

* turn system
* phase system
* lane combat
* simultaneous damage
* damage persistence
* summon system
* Stand By system
* resource system
* Infuse system
* Revolve system
* fatigue system
* Ace system
* targeting validation
* combat sequencing

# Deliverables

* fully playable CLI simulation
* deterministic game state
* unit tests
* replay-safe architecture

# Priority

CRITICAL

---

# PHASE 2 — Effect System

# Goal

Build scalable card interaction architecture.

# Features

* trigger system
* deterministic effect queue
* targeting system
* activated abilities
* combat triggers
* ON_PLAY effects
* ON_DESTROY effects
* Primed support
* serialization-safe effects

# Deliverables

* reusable effect engine
* JSON-driven effect system
* testable card scripting framework

# Priority

CRITICAL

---

# PHASE 3 — Internal Debug Sandbox

# Goal

Create development tools for fast iteration.

# Features

* local PvP sandbox
* game state viewer
* developer debug panel
* phase controls
* board inspector
* effect logs
* replay viewer prototype

# Deliverables

* rapid testing environment
* balancing workflow foundation

# Priority

HIGH

---

# PHASE 4 — Bot Simulation Framework

# Goal

Automate gameplay testing.

# Features

* basic AI players
* scripted bots
* random simulation bots
* stress testing
* automated balance testing
* match replay generation

# Deliverables

* simulation environment
* automated gameplay testing

# Priority

HIGH

---

# PHASE 5 — Multiplayer Infrastructure

# Goal

Build online PvP functionality.

# Features

* Colyseus room server
* websocket synchronization
* reconnect support
* friend match system
* room invites
* deterministic state sync

# Deliverables

* online playable matches
* stable multiplayer synchronization

# Priority

HIGH

---

# PHASE 6 — Frontend Gameplay UI

# Goal

Build competitive gameplay interface.

# Features

* battlefield UI
* hand interaction
* drag & drop
* attack visualization
* lane targeting
* responsive layout
* card zoom
* turn timer
* match HUD

# UX Goals

* competitive readability
* fast interaction speed
* minimal visual clutter

# Deliverables

* playable browser client

# Priority

HIGH

---

# PHASE 7 — Animation / Audio Layer

# Goal

Add gameplay feedback and polish.

# Features

* attack VFX
* spell VFX
* hit feedback
* summon animation
* lane highlights
* camera shake
* sound effect hooks
* music hooks

# Important Requirement

SFX/VFX systems must be:

* modular
* replaceable
* data-driven

Developers should be able to:

* swap sound assets easily
* replace animation assets without gameplay changes

# Priority

MEDIUM

---

# PHASE 8 — Internal Card Editor

# Goal

Create scalable content pipeline.

# Features

* internal card editor
* effect editor
* keyword assignment
* art upload
* validation tools
* local test injection
* card preview

# Deliverables

* scalable card creation workflow

# Priority

HIGH

---

# PHASE 9 — Account & Meta Systems

# Goal

Create persistent player progression.

# Features

* Google authentication
* profile system
* collection system
* deck builder
* saved decks
* match history

# Deliverables

* persistent player accounts

# Priority

MEDIUM

---

# PHASE 10 — Replay & Spectator Systems

# Goal

Support competitive integrity and sharing.

# Features

* replay saving
* replay playback
* spectator mode
* match history viewer
* timeline controls

# Deliverables

* deterministic replay infrastructure

# Priority

MEDIUM

---

# PHASE 11 — Competitive Systems

# Goal

Expand PvP systems.

# Features

* ranked matchmaking
* MMR
* BO1 queue
* BO3 queue
* tournament support
* seasonal systems

# Deliverables

* scalable competitive ecosystem

# Priority

MEDIUM

---

# PHASE 12 — PvE Roguelike Academy Prototype

# Goal

Begin narrative roguelike systems.

# Features

* academy map structure
* time progression
* encounter system
* hidden variables
* school activities
* shop encounters
* exams
* branching progression

# Example Encounter Flow

```txt id="y7fpy0"
Monday Morning
↓
Attend Class
OR
Visit Card Shop
```

Possible hidden variables:

* academic performance
* reputation
* rivalry
* discipline
* social affinity

These variables may:

* unlock future encounters
* alter story routes
* affect duel opportunities

# Priority

LOW (for now)

---

# PHASE 13 — PvE/PvP Hybrid Integration

# Goal

Connect academy progression with real player interaction.

# Features

* asynchronous PvP encounters
* academy tournaments
* player ghost battles
* seasonal academy events

# Priority

LOW

---

# PHASE 14 — Live Service Infrastructure

# Goal

Support long-term operation.

# Features

* analytics
* telemetry
* patch pipeline
* card balance tools
* server monitoring
* moderation tools

# Priority

LOW

---

# Architecture Principles

# Deterministic First

Gameplay must always:

* produce identical results from identical inputs

---

# Server Authoritative

Clients never:

* decide legality
* decide combat outcomes
* own official game state

---

# Modular Systems

Systems should remain:

* replaceable
* testable
* isolated

Especially:

* SFX
* VFX
* UI
* card effects

---

# Readability First

The game prioritizes:

* competitive clarity
* fast readability
* low visual noise

over:

* excessive cinematic effects
* overly long animations

---

# Long-Term Design Philosophy

The project aims to create:

* a deeply strategic PvP card game
* with strong deck identity
* evolving cyclical gameplay
* tactical positioning
* and meaningful progression systems

while maintaining:

* fast competitive pacing
* deterministic interactions
* scalable architecture
* long-term extensibility
