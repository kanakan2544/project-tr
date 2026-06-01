# CLAUDE.md — TCG Online

Competitive online tactical card game. Monorepo. Phase 9 in progress (Account & Meta — core slice: Google auth + deck builder + saved decks landed; profile + match history deferred).

> **IMPORTANT FOR AI ASSISTANTS**: When any phase is finished, **immediately update the Project Status table below** — change `🔲 NEXT` → `✅ DONE` and advance the next phase to `🔲 NEXT`. Also update the header line above. Do not wait for the user to ask.

## Project Status

| Phase | Name | Status |
|-------|------|--------|
| 1 | Core Engine Foundation | ✅ DONE |
| 2 | Effect System | ✅ DONE |
| 3 | Internal Debug Sandbox | ✅ DONE |
| 4 | Bot Simulation Framework | ✅ DONE |
| 5 | Multiplayer Infrastructure | ✅ DONE |
| 6 | Frontend Gameplay UI | ✅ DONE |
| 7 | Animation / Audio Layer | ✅ DONE |
| 8 | Internal Card Editor | ✅ DONE |
| 9 | Account & Meta Systems | 🚧 IN PROGRESS (core done; profile + match history deferred) |
| 10 | Replay & Spectator Systems | 🔲 TODO |
| 11 | Competitive Systems | 🔲 TODO |
| 12 | PvE Roguelike Academy Prototype | 🔲 TODO |
| 13 | PvE/PvP Hybrid Integration | 🔲 TODO |
| 14 | Live Service Infrastructure | 🔲 TODO |

## Tech Stack

- **Monorepo**: pnpm workspaces + Turborepo
- **Language**: TypeScript (strict mode everywhere)
- **Frontend**: Next.js 14 (App Router), TailwindCSS, Framer Motion
- **Auth**: NextAuth (Auth.js v5) — Google OAuth, JWT session (Phase 9)
- **Server**: Colyseus 0.15, Express
- **Database**: PostgreSQL + Prisma (`@tcg/db`) (Phase 9)
- **Testing**: Vitest (game-engine only)
- **Node**: >=18, pnpm >=9

## Monorepo Structure

```
tcg-online/
├── apps/
│   ├── web/          @tcg/web           — Next.js frontend (rendering ONLY)
│   └── server/       @tcg/server        — Colyseus game server (state sync ONLY)
├── packages/
│   ├── shared-types/ @tcg/shared-types  — all TS interfaces, enums, types
│   ├── card-data/    @tcg/card-data     — card definitions + registry + deck validator
│   ├── game-engine/  @tcg/game-engine   — ALL gameplay logic (authoritative)
│   ├── bot-framework/@tcg/bot-framework — bot players + simulation runner
│   └── db/           @tcg/db            — Prisma schema + client (Postgres)
├── docs/             — game design documents
├── turbo.json
├── tsconfig.base.json
└── pnpm-workspace.yaml
```

## Dependency Graph

```
@tcg/shared-types     ← no internal deps
       ↑
@tcg/card-data        ← imports shared-types
       ↑
@tcg/game-engine      ← imports shared-types + card-data
       ↑
@tcg/bot-framework    ← imports game-engine + shared-types + card-data
       ↑
@tcg/db               ← imports @prisma/client (no internal deps)
       ↑
apps/server           ← imports game-engine + shared-types + card-data + db
apps/web              ← imports shared-types + card-data + db (NOT game-engine)
```

**apps/web MUST NEVER import @tcg/game-engine.** ESLint `no-restricted-imports` rule enforces this in `apps/web/.eslintrc.json`. (web may import `@tcg/card-data` and `@tcg/db`.)

## Common Commands

```bash
pnpm install                               # install all workspace deps
pnpm dev                                   # run all apps in dev mode
pnpm build                                 # build all packages
pnpm test                                  # run all tests
pnpm typecheck                             # typecheck all packages
pnpm --filter @tcg/game-engine test        # run engine tests only
pnpm --filter @tcg/game-engine test:watch  # watch mode
pnpm --filter @tcg/web dev                # frontend only (port 3000)
pnpm --filter @tcg/server dev             # server only (port 2567)

# Database (Phase 9) — copy .env.example → .env first
docker compose up -d postgres              # start local Postgres
pnpm --filter @tcg/db db:migrate           # create/apply migrations
pnpm --filter @tcg/db db:generate          # regenerate Prisma client
pnpm --filter @tcg/db db:studio            # browse the DB
```

## Architecture Principle

> **"React renders. Engine decides. Colyseus synchronizes."**

- **Frontend** (`apps/web`): rendering, animations, UI only. Zero game logic.
- **Server** (`apps/server`): room management, WebSocket sync. Delegates ALL logic to engine.
- **Game Engine** (`packages/game-engine`): ALL gameplay rules, validation, combat. Deterministic. No async, no side effects, no `Math.random()` in logic paths.

## Game Engine — Key Facts

- `GameEngine.dispatch(action)` is the single entry point. Returns `ActionResult { success, state, events }`.
- State is deep-cloned on every dispatch — consumers cannot mutate internal state.
- Seeded Fisher-Yates shuffle is the ONLY randomness source (stored in `GameState.shuffleSeed`).
- All game logic is testable without UI or network.

### Turn Flow

```
START_TURN → MAIN_PHASE → ATTACK_PHASE → END_TURN_SELECT* → END_TURN → (next player's START_TURN)
```

\* END_TURN_SELECT only triggered if active player has >2 cards in hand.

### Key Design Decisions

- **Stand By cleared at START_TURN** (not END_TURN) — unit summoned turn N cannot attack; free on turn N+1.
- **Draw at END_TURN** — keep 2, discard rest to revolve pile, draw until hand=5.
- **Ace card lives in `player.ace` slot**, not hand. Unlocks after `revolveCount >= 1`.
- **`CardInstance[]` for all zones** (deck, hand, revolve, discard) — preserves `primedInfuseCount`.
- **Keywords** resolved via `keyword-resolver.ts` + `effect-trigger-system.ts`. Active set: Guard, Overkill, Lifesteal, Spellshield, Silence, Charge, QuickAttack, DoubleAttack, Barrier, Defender, Steadfast, Ambush, Evasion, Lonesome, Piercing. Activation abilities support 1/Game restriction.
- **Colyseus uses `@Schema` state sync.**

## Game Engine — File Map

```
packages/game-engine/src/
├── core/
│   ├── game-engine.ts           ← GameEngine class (public API, dispatch loop)
│   ├── game-state-factory.ts    ← createInitialGameState()
│   ├── action-executor.ts       ← routes actions to systems
│   └── win-condition-checker.ts
├── validators/
│   └── action-validator.ts      ← returns ValidationError | null
├── phases/
│   ├── phase-manager.ts         ← phase transitions (START_TURN → MAIN → etc.)
│   └── draw-system.ts           ← draw + revolve + fatigue
├── systems/
│   ├── summon-system.ts         ← SUMMON_UNIT action
│   ├── infuse-system.ts         ← INFUSE_CARD action
│   ├── spell-system.ts          ← CAST_SPELL action
│   ├── end-turn-system.ts       ← END_TURN_SELECT action
│   ├── keyword-resolver.ts      ← hasKeyword (Silence-aware), applySummonKeywords
│   ├── primed-system.ts         ← evaluatePrimedAtSummon, evaluateBattlefieldPrimed
│   ├── activated-ability-system.ts ← executeActivateAbility
│   └── aura-system.ts           ← aura evaluation (e.g. CecilStedman +atk aura)
├── combat/
│   ├── combat-resolver.ts       ← outer loop (lanes 0–4)
│   ├── lane-combat.ts           ← per-lane resolution
│   ├── attack-targeting.ts      ← Guard redirect logic
│   └── damage-calculator.ts     ← simultaneous damage + Overkill/Lifesteal + triggers
├── effects/
│   ├── effect-trigger-system.ts ← deterministic trigger engine (ON_SUMMON, ON_DESTROY, etc.)
│   ├── effect-applicator.ts     ← applyEffect — single switch over EffectType
│   └── target-resolver.ts       ← resolveTarget, resolveAllTargets
└── utils/
    ├── state-helpers.ts         ← pure read helpers (deepCloneState, getPlayer, etc.)
    ├── id-generator.ts          ← deterministic counter-based IDs
    ├── seeded-shuffle.ts        ← LCG seeded Fisher-Yates
    └── unit-lifecycle.ts        ← destroyUnit (canonical, shared across systems)
```

## Tests

**game-engine**: `packages/game-engine/src/__tests__/`

```
turn-flow.test.ts           — phase transitions, turn counter, active player
combat.test.ts              — Stand By, Charge, direct attack, damage
infuse.test.ts              — resources, revolve pile, cost validation
lane-validation.test.ts     — bounds, occupied lanes, all 5 lanes
keywords.test.ts            — Guard, Overkill, Lifesteal, Charge, Barrier, QuickAttack
revolve.test.ts             — Revolve trigger, revolveCount, Ace lock, fatigue
end-turn-select.test.ts     — hand selection, auto-proceed, validation
effect-system.test.ts       — ON_SUMMON, ON_DESTROY, ON_ATTACK triggers
primed.test.ts              — primedInfuseCount tracking, isPrimed, primedStats, UNIT_PRIMED
activated-abilities.test.ts — Channel Storm ability, oncePerTurn, Silence block, reset
invincible-revolve.test.ts  — Invincible card set: revolve-based effects
invincible-conditional.test.ts — conditional triggers (CONTROLS_X_UNITS, etc.)
invincible-aura.test.ts     — aura effects (CecilStedman)
invincible-spells.test.ts   — Invincible spell cards
deck-validator.test.ts      — validateDeck rules
```

Test helpers: `helpers.ts` (endFullTurn), `helpers-invincible.ts`. Use `endFullTurn(engine, playerId)` instead of raw END_MAIN_PHASE when the player might have >2 cards.

**bot-framework**: `packages/bot-framework/src/__tests__/`

```
action-generator.test.ts  — valid action enumeration, summon counts, phase routing
random-bot.test.ts        — determinism, fallback, legal actions
greedy-bot.test.ts        — infuse-first, summon-when-able, END_TURN_SELECT handling
simulation-runner.test.ts — termination, action recording, determinism, maxTurns cap
stress-tester.test.ts     — game count, win distribution, turn range sanity
```

## Sample Cards (for testing)

| id | Type | Stats | Keywords | Cost |
|----|------|-------|----------|------|
| iron_sentinel | Unit | 2/4 | — | 3 |
| flame_vanguard | Unit | 4/3 | Charge | 3 |
| shield_guardian | Unit | 3/5 | Guard | 4 |
| overkill_striker | Unit | 6/2 | Overkill | 4 |
| blood_reaper | Unit | 4/4 | Lifesteal, Overkill | 5 |
| cyclone_sovereign | Unit (Legendary/Ace) | 7/7 | Charge, Lifesteal | 7 |
| quick_strike | Spell | — | — | 2 |
| restoration | Spell | — | — | 3 |
| silence_bolt | Spell | — | — | 2 |
| ember_seer | Unit | 2/3 | — | 4 |
| grave_sentinel | Unit | 2/4 | — | 3 |
| storm_channeler | Unit | 3/4 | — | 5 |
| inferno_vanguard | Unit | 3/3 (5/5 primed) | — | 4 |
| donald_ferguson | Unit (Invincible) | 1/2 | ON_SUMMON: Revolve top 1 | 1 |
| reanimen | Unit (Invincible) | 2/1 | Charge | 1 |
| dupli_cate | Unit (Invincible) | 2/2 | ON_SUMMON: Add Dupli-Cate to hand | 2 |
| atom_eve | Unit (Invincible) | 1/4 | ON_SUMMON: Revolve top 1 | 2 |
| robot | Unit (Invincible) | 2/4 | ON_SUMMON: Revolve top 2 | 3 |
| cecil_stedman | Unit (Legendary/Ace, Invincible) | 0/3 | Aura: adj allies +3 atk × revolveCount | 3 |
| rex_splode | Unit (Invincible) | 4/3 | ON_ATTACK: Revolve top 1 | 3 |
| monster_girl | Unit (Invincible) | 4/5 | — | 4 |
| oliver_grayson | Unit (Invincible) | 5/3 | Primed (revolved 1×): gain Evasion | 4 |
| tech_jacket | Unit (Invincible) | 4/4 | QuickAttack | 4 |
| allen_the_alien | Unit (Invincible) | 5/5 | 1/turn cost 2: +0/+1 | 5 |
| invincible | Unit (Legendary/Ace, Invincible) | 5/5 → 6/6 primed | Primed: +1/+1 + QuickAttack | 5 |
| immortal | Unit (Invincible) | 5/7 | ON_DESTROY: return self to revolve pile | 6 |
| omni_man | Unit (Legendary/Ace, Invincible) | 6/7 → 8/9 primed | Primed: +2/+2 + Piercing | 7 |
| send_to_the_jail | Spell (Invincible) | — | Opp lowest-cost revolve → discard | 2 |
| team_up | Spell (Invincible) | — | If 5 units: all allies +3/+3 | 4 |
| cross_the_line | Spell (Invincible) | — | Ally +3 atk; grant ON_KILL: 3 revolve→deck | 3 |

## Docs

All game design docs live in `docs/`:

- `GAME_OVERVIEW.md` — vision and core mechanics
- `RULEBOOK.md` — official rules (deck size, life, turn structure)
- `CARD_STRUCTURE.md` — card data schema
- `EFFECT_SYSTEM.md` — trigger types, effect resolution
- `KEYWORDS.md` — keyword definitions
- `BALANCE_GUIDELINES.md` — balance philosophy
- `GAME_ENGINE_ARCHITECTURE.md` — technical architecture
- `ROADMAP.md` — 14-phase development plan

When implementation conflicts with docs, **docs take priority**.

## Bot Framework — File Map

```
packages/bot-framework/src/
├── bots/
│   ├── bot-interface.ts     ← BotPlayer interface { name, selectAction(state, playerId) }
│   ├── action-generator.ts  ← generateValidActions(state, playerId) — enumerates all legal moves
│   ├── random-bot.ts        ← RandomBot — seeded-random selection, deterministic
│   └── greedy-bot.ts        ← GreedyBot — summon > spell > ability > infuse > end
├── simulation/
│   ├── simulation-runner.ts ← runSimulation(config) → SimulationResult
│   └── stress-tester.ts     ← runStressTest(config) → StressTestResult (N games, aggregated)
└── index.ts
```

## Frontend — File Map

```
apps/web/src/
├── auth.ts                          ← NextAuth config (server)
├── auth.config.ts                   ← edge-safe auth config
├── middleware.ts                    ← gates /, /collection, /decks, /game/*
├── app/
│   ├── page.tsx                     ← lobby / home
│   ├── layout.tsx                   ← root layout
│   ├── login/page.tsx               ← sign-in page
│   ├── decks/page.tsx               ← saved decks list
│   ├── collection/page.tsx          ← browse all cards
│   ├── game/[roomId]/page.tsx       ← main game page (Colyseus client)
│   ├── debug/page.tsx               ← debug sandbox
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── decks/route.ts           ← list/create decks
│       ├── decks/[id]/route.ts      ← get/update/delete deck
│       └── match-token/route.ts     ← issue HS256 match token
├── components/
│   ├── board/
│   │   ├── GameBoard.tsx            ← board layout, lane rendering
│   │   ├── GameHUD.tsx              ← life totals, turn info, phase buttons
│   │   ├── LaneGrid.tsx             ← 5-lane grid with dnd-kit drag-drop
│   │   ├── CardView.tsx             ← card renderer (hand/board/tooltip sizes)
│   │   ├── UnitOnBoard.tsx          ← board unit with combat animations + ability button
│   │   ├── HandDisplay.tsx          ← hand cards with dnd-kit drag
│   │   ├── AceSlot.tsx              ← ace/legendary card slot (locked/unlocked)
│   │   ├── InfuseZone.tsx           ← infuse drop target
│   │   ├── EventFeed.tsx            ← game event log
│   │   ├── CardTooltipContext.tsx   ← tooltip state context
│   │   └── PileModal.tsx            ← view deck/revolve/discard piles
│   ├── animation/
│   │   ├── DamageNumber.tsx         ← floating damage numbers
│   │   ├── TurnIndicator.tsx        ← turn transition UI
│   │   ├── PhaseBanner.tsx          ← phase change banner
│   │   └── GameOverCelebration.tsx  ← win/lose screen
│   ├── editor/
│   │   ├── CardEditorForm.tsx       ← internal card editor shell
│   │   ├── MetadataSection.tsx, UnitSection.tsx, SpellSection.tsx
│   │   ├── AbilityList.tsx, LocaleSection.tsx
│   │   ├── CardPreviewPane.tsx, ExportPanel.tsx
│   │   └── types.ts, validate.ts, draft-to-card.ts, generate-ts.ts
│   ├── collection/
│   │   └── CollectionGrid.tsx       ← browse-all card grid
│   ├── deck/
│   │   └── DeckBuilder.tsx          ← deck builder UI
│   ├── layout/
│   │   └── UserNav.tsx              ← top nav with user avatar/sign-out
│   ├── auth/
│   │   └── Providers.tsx            ← SessionProvider wrapper
│   ├── lobby/
│   │   └── MatchLobby.tsx           ← pre-game lobby
│   └── debug/
│       ├── PlayerDebugPanel.tsx     ← debug state panel
│       ├── StateInspector.tsx       ← raw state viewer
│       └── EventLog.tsx             ← debug event log
├── animation/
│   ├── animation-queue-context.tsx  ← AnimationQueueContext, useIsAnimating, useCurrentAnimation
│   ├── event-to-steps.ts            ← converts GameEvent[] → AnimationStep[]
│   ├── framer-variants.ts           ← Framer Motion variant objects (lunge, impact, death, glow, block)
│   ├── types.ts                     ← AnimationStep union type + AnimationStepKind
│   └── constants.ts                 ← animation durations
├── audio/
│   ├── sound-keys.ts, audio-system.ts
│   ├── animation-to-sound.ts        ← maps AnimationStep → sound key
│   └── use-audio-preloader.ts
├── hooks/
│   ├── useGameClient.ts             ← Colyseus connection + action dispatch
│   ├── useDebugClient.ts            ← debug room client
│   └── useTargetSelection.ts        ← target selection state
├── lib/
│   ├── colyseus-client.ts, debug-client.ts
│   ├── match-token.ts               ← sign/verify HS256 match token (web side)
│   └── types.ts
└── types/
    └── next-auth.d.ts               ← session type augmentation
```

## Server — File Map

```
apps/server/src/
├── index.ts                         ← Colyseus server entry, port 2567
├── auth/
│   └── match-token.ts              ← verifies HS256 match token (shared AUTH_SECRET) (Phase 9)
└── rooms/
    ├── GameRoom.ts                  ← main multiplayer room (delegates logic to game-engine)
    ├── DebugRoom.ts                 ← single-player debug room
    └── state-sanitizer.ts          ← filters GameState per-player before broadcasting
```

## Phase 9 — Account & Meta (core slice)

Persistent accounts + deck building. Done in this slice; **deferred:** profile/stats UI, match-history recording, card ownership/economy (collection is browse-all).

**Auth flow:** NextAuth (Auth.js v5) Google OAuth in `apps/web` (`src/auth.ts` + edge-safe `src/auth.config.ts`), Prisma adapter, JWT session. `src/middleware.ts` gates `/`, `/collection`, `/decks`, `/game/*`.

**Deck → match flow (server stays authoritative):**
1. Lobby (`MatchLobby.tsx`) picks a saved deck → `sessionStorage[tcg-deck-{code}]`.
2. `useGameClient` POSTs `/api/match-token {deckId}` → web verifies ownership, returns short-lived HS256 token (`src/lib/match-token.ts`, signed with `AUTH_SECRET`).
3. Client `joinGame(matchKey, token)`; `GameRoom.onJoin` (now async) verifies the token, loads the deck from Postgres, re-runs `validateDeck`, and rejects on failure. Client never sends a raw card list.

**Deck rules** live in `@tcg/card-data/deck-validator.ts` (`validateDeck`): 30 cards, max 2 copies, ace must be Legendary, main cards must match ace class or be Neutral. Single source of truth for the builder (live) and the server (join). Test: `packages/game-engine/src/__tests__/deck-validator.test.ts`.

**Key files:** `packages/db/prisma/schema.prisma` (User/Account/Session/Deck), web `src/app/api/decks/*` + `/api/match-token`, `src/components/deck/DeckBuilder.tsx`, `src/components/collection/CollectionGrid.tsx`.

**Setup:** copy `.env.example` → `.env` (DATABASE_URL, AUTH_SECRET, GOOGLE_CLIENT_ID/SECRET), `docker compose up -d postgres`, `pnpm --filter @tcg/db db:migrate`.

