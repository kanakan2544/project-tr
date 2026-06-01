# CLAUDE.md — @tcg/web

Next.js 14 frontend for TCG Online. **Rendering only — zero game logic.**

## Core Constraint

**NEVER import `@tcg/game-engine`.** ESLint `no-restricted-imports` in `.eslintrc.json` enforces this.
Allowed imports: `@tcg/shared-types` (types/enums only), `@tcg/card-data` (card definitions).

## Design System — Color Tokens

Defined in `tailwind.config.ts`. Use these class names, not raw hex.

| Token | Class | Hex | Semantic use |
|-------|-------|-----|--------------|
| ink | `text-ink` / `border-ink` | #15131a | outlines, text |
| parchment | `bg-parchment` | #fdf6e8 | card background |
| parchment-2 | `bg-parchment-2` | #fff9f0 | card face |
| parchment-deep | `bg-parchment-deep` | #f5e9d0 | card image bg |
| warm-brown | `text-warm-brown` | #2d1b0e | card name text |
| gold | `bg-gold` / `text-gold` | #e8a832 | infuse value, WAIT badge, cost badge bg |
| magic-sky | `bg-magic-sky` / `text-magic-sky` | #8ecfed | cost value |
| magic-purple | `text-magic-purple` | #9b7dd4 | keyword text |
| magic-blush | `bg-magic-blush` | #fbc8d4 | keyword badge bg |
| magic-rose | `bg-magic-rose` | #f4a0b5 | PRIMED badge bg |
| life-green | `bg-life-green` / `text-life-green` | #6ab87a | health (HP) |
| life-red | `bg-life-red` / `text-life-red` | #e05a5a | attack (ATK) |

### Stat Semantic Mapping

| Stat | bg | text |
|------|----|------|
| ATK | `bg-life-red` | `text-parchment-2` |
| HP | `bg-life-green` | `text-parchment-2` |
| Cost | `bg-magic-sky` | `text-ink` |
| Infuse | `bg-gold` | `text-ink` |

## Card Badge Pattern

All stat/keyword badges use this consistent style:

```tsx
className="rounded-sm border-[2px] border-ink bg-[COLOR] px-1 font-mono text-[Xpx] font-bold text-[TEXT] shadow-[1px_1px_0_#15131a]"
```

Rarity shadow on card container:
- Common: `shadow-ink-sm`
- Uncommon: `shadow-[4px_4px_0_#6ab87a]`
- Rare: `shadow-[4px_4px_0_#a8b8e8]`
- Legendary: `shadow-[4px_4px_0_#e8a832]`

## Card Components

### CardView (`components/board/CardView.tsx`)

Sizes: `hand` (h-28 w-20) | `board` (h-28 w-20) | `tooltip` (h-44 w-32).

Layout (top → bottom):
1. Name row
2. Image section (`flex-1`, `relative`) — stat badges overlaid inside:
   - Top of image: infuse badge (left) + cost badge (right) — **hand size only**
   - Bottom of image: ATK badge (left) + HP badge (right) — **units only**
3. Keywords row — **tooltip size only**

Card images served from `public/cards/{cardId}.jpg`. Fallback: `/cards/d_d_001.jpg`.

### UnitOnBoard (`components/board/UnitOnBoard.tsx`)

Board unit with combat animations. Layout:
1. Name row
2. Image section (`flex-1`, `relative`) — overlaid:
   - Top: WAIT / PRIMED / keyword badges
   - Bottom: ATK badge (left) + HP badge (right)
3. Ability button (⚡) — `absolute bottom-6 right-1`, shown only when ability available

## Animation System

### How It Works

`AnimationQueueContext` (`animation/animation-queue-context.tsx`) holds a queue of `AnimationStep` objects. Steps are consumed one at a time with a timer.

Game events from Colyseus → `gameEventToSteps()` → `AnimationStep[]` → enqueued.

### Hooks (consume in components)

```ts
// Is a specific step kind active for a specific unit?
useIsAnimating(instanceId: string, kind: AnimationStepKind): boolean

// Get the current animation step (for DAMAGE_NUMBER etc.)
useCurrentAnimation(): AnimationStep | null
```

### AnimationStep Kinds

`SUMMON_FLY_IN` | `UNIT_LUNGE` | `UNIT_IMPACT` | `DAMAGE_NUMBER` | `HEALTH_BAR_UPDATE` |
`UNIT_DEATH` | `SPELL_FLASH` | `PHASE_BANNER` | `TURN_INDICATOR` | `PLAYER_DAMAGE_SHAKE` |
`ACE_UNLOCK` | `REVOLVE_PULSE` | `UNIT_PRIMED_GLOW` | `SPELLSHIELD_BLOCK` | `ABILITY_BURST` | `IDLE`

### Framer Motion Variants

Defined in `animation/framer-variants.ts`. Used by `UnitOnBoard` and `LaneGrid`.

| Export | Used for |
|--------|----------|
| `unitLungeMyVariants` | my unit attacking |
| `unitLungeOppVariants` | opponent unit attacking |
| `unitImpactVariants` | unit receiving hit |
| `unitDeathVariants` | unit dying |
| `primedGlowVariants` | unit becoming primed / ability burst |
| `spellshieldBlockVariants` | spellshield absorbing spell |

## Colyseus Client Pattern

Game page (`app/game/[roomId]/page.tsx`) connects to server via Colyseus client SDK.
Server runs on port `2567`. Room types: `"game"` (multiplayer), `"debug"` (single-player).

State received from server is `GameState` from `@tcg/shared-types` — already sanitized per-player by `state-sanitizer.ts` on the server.

## Fonts

| Variable | Family | Used for |
|----------|--------|----------|
| `--font-display` | Georgia/serif | Card names (`font-display`) |
| `--font-body` | system-ui | General UI (`font-body`) |
| `--font-mono` | Menlo | Stat numbers (`font-mono`) |
| `--font-impact` | Impact | Cost badges (`font-impact`) |
