# Wool Crush — Design

**Date:** 2026-07-29 (revised same day after clarifying the actual game)
**Type:** New self-contained mini-game for LNP Hub

> **Revision note:** The first draft of this spec assumed a match-3 color game
> (Candy Crush style). That was wrong. The real game is a **dragon color-sequence
> game**, specified below. The match-3 build was discarded; the self-contained
> module shell (routing, layout, i18n, localStorage, catalog card) is reused.

## Summary

A dragon flies across the screen carrying a **visible sequence of colored scales**.
Below is a **shuffled tray of colored items** (exactly the sequence's colors, reordered).
The player taps items to match the dragon's colors **in order**; each correct tap clears
that scale and removes the tray item. Clear the whole sequence before the dragon exits →
**dragon defeated, level passed**. If the dragon escapes first → **lose a life**. Levels
get harder (longer sequence, faster dragon, more colors). Out of lives → Game Over.
Score and best level persist in `localStorage`.

## Decisions (locked)

- **Persistence:** `localStorage` only (key `wool-crush-progress` → `{ highScore, bestLevel }`).
- **Colors visible:** the dragon's sequence is shown the whole time (reaction, not memory).
- **Tray:** exactly the sequence's colors, shuffled — no distractor colors.
- **Order:** must tap colors in the dragon's head→tail order; the next-required scale is highlighted.
- **Wrong tap:** forgiving — the tapped item shakes, no penalty. Time is the only pressure.
- **Timer:** the dragon's crossing time IS the countdown. Escape = lose a life.
- **Level pass:** defeat one dragon = advance to the next (harder) level.
- **Lives:** start with 3. Losing a dragon costs a life and retries a fresh dragon at the same level. 0 lives → Game Over.
- **Name:** kept as "Wool Crush" per the user (theme is a dragon).

## Difficulty curve (per level, 1-indexed)

- `sequenceLength(level) = min(8, 3 + (level - 1))`
- `colorCount(level) = min(6, 3 + floor((level - 1) / 2))`
- `crossMs(level) = max(4000, 9000 - (level - 1) * 500)`
- `levelScore(level, remainingMs) = 100 * level + max(0, round(remainingMs / 50))`

## Architecture

```
src/games/wool-crush/
  index.jsx              # nested <Routes> (reused, unchanged)
  components/
    Layout.jsx           # game header + back-to-Hub (reused, unchanged)
    Dragon.jsx           # dragon + colored scales; crossing animation; highlights next-required scale
    Tray.jsx             # shuffled colored item buttons; shake on wrong tap; used items disappear
  lib/
    game.js              # pure logic: level params, sequence/tray generation, scoring (React-free)
    colors.js            # WOOL_COLORS palette (first 6 used as game colors)
    storage.js           # localStorage { highScore, bestLevel }
  pages/
    Play.jsx             # game loop: level/score/lives/phase state machine, timing, overlays
```

Shell wiring (reused from the first build): lazy route in `App.jsx`, Mini Games card in
`Catalog.jsx`, `wool.*` + `catalog.wool_*` i18n keys (en/vi/ja).

Key principle: `game.js` is **pure, React-free** — hand-tested with a Node assert script.
All timing/animation lives in `Play.jsx`/components.

## Game loop (Play.jsx state machine)

`phase ∈ { playing, cleared, escaped, gameover }`.

- **startLevel(lvl):** build `{ sequence, tray, crossMs }` via `makeSequence(lvl)`; reset
  `progress = 0`; start the dragon crossing animation; arm an escape timeout at `crossMs`.
- **pick(tileId):** ignored unless `playing`. If the tile's color === `sequence[progress]`
  and unused → mark used, `progress++`; if `progress === length` → **defeat**. Else → shake the tile.
- **defeat():** clear the escape timeout; `score += levelScore(level, remaining)`;
  `bestLevel = max(bestLevel, level)`; `phase = cleared`; after ~900ms → `startLevel(level + 1)`.
- **escape() (timeout):** `lives--`; `phase = escaped`; after ~1000ms → `lives <= 0` ?
  **gameover** : `startLevel(level)` (retry same level, fresh dragon).
- **gameover():** persist high score + best level; overlay with final score, best level,
  "New record!" when beaten, and **Play Again** (resets to level 1).

Timing reads use `Date.now()` and `setTimeout`; values read inside timeouts come from refs
(`levelRef`, `livesRef`, `scoreRef`) to avoid stale closures and `setState`-in-updater side effects.

## UI

- **Dragon.jsx:** 🐉 head + a row of colored scale circles (one per sequence color). Cleared
  scales dim; the next-required scale pulses. The dragon translates left→right over `crossMs`
  (CSS transition, linear). On defeat, a burst replaces it briefly.
- **Tray.jsx:** shuffled color buttons (same SVG wool-ball look as before, reused idea). Correct
  tap → the item fades out; wrong tap → `wool-shake`.
- **HUD:** level, score, lives (hearts), and a time bar that drains over `crossMs`.
- All text via `useT()` (`wool.*`, en/vi/ja). Chrome uses `arena-*` tokens; the 6 game colors are fixed.

## Testing

No test runner. Verification:
- `node src/games/wool-crush/lib/game.test.js` — asserts the difficulty curve, scoring, shuffle
  (permutation invariant), and `makeSequence` (length, color range, tray = shuffle of sequence).
- `npm run lint` clean; `npm run build` succeeds.
- Manual play (behind Google login) — see the plan's verification checklist.

## Out of scope (YAGNI)

- Match-3 / grid mechanics (discarded).
- Distractor tray colors, combos, power-ups.
- Sound, memory mode, multiplayer, Supabase leaderboard.
