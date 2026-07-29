# Wool Crush — Design

**Date:** 2026-07-29
**Type:** New self-contained mini-game for LNP Hub

## Summary

Wool Crush is a match-3 game (Candy Crush style, wool/yarn theme). Players swap
adjacent wool balls to line up 3+ of the same color; matched balls clear, the board
cascades (balls fall, new ones fill from the top), and cascades chain for bonus points.
The game is **endless** — it ends only when no swap can produce a match (Game Over).
Score and high score are stored in `localStorage` only; no Supabase, no shared
leaderboard.

## Decisions (locked)

- **Persistence:** `localStorage` only (like `lucky-wheel`). No DB, no shared leaderboard.
- **Game mode:** Endless — play until no valid move remains.
- **Board:** 9×9 grid, 7 wool colors (hardest tier).
- **Special tiles:** None. Plain 3+ matches only.
- **Tile art:** Hand-drawn SVG wool balls, one per color.
- **Interaction:** Tap a tile to select, tap an adjacent tile to swap. Invalid swap
  (no resulting match) animates back.

## Architecture

Self-contained game folder following the Hub convention:

```
src/games/wool-crush/
  index.jsx              # default export = nested <Routes>, mounts Layout + Play
  components/
    Layout.jsx           # game header + back-to-Hub (modeled on lucky-wheel)
    Board.jsx            # 9x9 grid render, selection + swap handling, cascade animation
    WoolTile.jsx         # one tile = SVG wool ball by color; states: normal/selected/falling
  lib/
    engine.js            # pure logic, no React dependency
    storage.js           # localStorage high-score read/write (key: "wool-crush-highscore")
  pages/
    Play.jsx             # play screen: board + current score + high score + game over/restart
```

Wiring into the shell:
- `App.jsx`: add `lazy(() => import("./games/wool-crush"))` + `<Route path="/wool-crush/*">`
  inside the existing `<ProtectedRoute>` group.
- `Catalog.jsx`: add a card object for Wool Crush.
- `i18n.jsx`: add `woolCrush.*` keys with `{ en, vi, ja }`.

Key principle: `engine.js` is **pure, React-free logic** — hand-testable and decoupled
from rendering.

## Engine (`lib/engine.js`)

Constants: `SIZE = 9`, `COLORS = 7`.

- `createBoard()` → 9×9 board with **no pre-existing matches** and **at least one valid
  move** available.
- `findMatches(board)` → set of cell coords in any run of ≥3 same-color tiles
  (horizontal or vertical).
- `trySwap(board, a, b)` → if `a` and `b` are adjacent and swapping produces a match,
  return the new board; otherwise signal invalid (UI animates the swap back).
- `resolveBoard(board)` → cascade loop: clear matches → tiles fall down → refill from top
  → repeat until no matches. Returns `{ board, cleared, cascades }` for scoring.
- `hasValidMove(board)` → scans every adjacent pair for any swap that would create a
  match. `false` ⇒ Game Over.

**Scoring:** each cleared tile = 10 points, multiplied by cascade tier — the first clear
is ×1, each subsequent chained cascade is ×2, ×3, … A run longer than 3 gives +5 bonus
per extra tile.

**Game over:** when `hasValidMove` returns false.

## UI & interaction

- **`WoolTile.jsx`**: each color is a hand-drawn SVG wool ball (coil rings + a few
  diagonal strands), 7 distinct colors inspired by the `arena-*` palette. States:
  normal / selected (bright ring + slight lift) / falling (transform transition).
- **`Board.jsx`**: responsive 9×9 grid (`max-width`, tiles scale to viewport so it plays
  on phones). Tap tile 1 → highlight; tap adjacent tile → call `trySwap`; valid → animate
  swap + `resolveBoard`; invalid → shake back.
- **`Play.jsx`**: shows current **Score** + **High Score**; when `hasValidMove` is false,
  a **Game Over** overlay shows the final score + **Play Again**. If the new score beats
  the stored high score, save to `localStorage` and show a "New record!" badge.
- Animations use CSS transitions (transform/opacity) for falling & swapping — no external
  animation library.
- All display text via `useT()` under a `woolCrush.*` namespace (en/vi/ja).

## Theming

Style with `arena-*` tokens (Tailwind) so both light and dark themes work. The 7 wool
colors are fixed hues (they must stay distinguishable in both themes); surrounding chrome
(background, borders, header, overlays) uses `arena-*` tokens.

## Testing

No test runner exists in this repo. Verification:
- `npm run lint` clean.
- `npm run dev` and manually play several rounds confirming: no matches on fresh board,
  swaps only succeed when they form a match, cascades chain and score correctly, falling
  + refill work, and Game Over triggers only when no valid move exists.

## Out of scope (YAGNI)

- Special/booster tiles.
- Timers or move limits.
- Supabase persistence / shared leaderboard.
- Sound effects.
