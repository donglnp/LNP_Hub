# Wool Crush Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an endless match-3 mini-game ("Wool Crush") to LNP Hub as a self-contained game module with a pure JS engine, SVG wool tiles, and a localStorage high score.

**Architecture:** New self-contained folder `src/games/wool-crush/` following the Hub convention (`index.jsx` owns nested routes; `components/`, `lib/`, `pages/`). All game rules live in a pure, React-free `lib/engine.js` (hand-testable with a plain Node script). `pages/Play.jsx` holds the HUD + Game Over overlay; `components/Board.jsx` owns board state, selection, swap + cascade animation; `components/WoolTile.jsx` renders one SVG wool ball. Wired into the shell via `App.jsx`, `Catalog.jsx`, and `i18n.jsx`.

**Tech Stack:** Vite + React 19 + React Router 7, Tailwind (`arena-*` tokens), plain JSX (no TypeScript, no test runner). Persistence: `localStorage` only.

## Global Constraints

- No TypeScript — plain `.js` / `.jsx` only.
- No new dependencies — CSS transitions/keyframes only, no animation library.
- No Supabase — persistence is `localStorage` only (high score key: `"wool-crush-highscore"`).
- Board: `SIZE = 9`, `COLORS = 7`.
- All user-facing text goes through `useT()` — add every key for `en`, `vi`, `ja`. Never hardcode display text.
- Style with `arena-*` Tailwind tokens for chrome (bg/border/text/overlays) so light + dark both work. The 7 wool hues are fixed and defined in one place.
- `package.json` has `"type": "module"` — Node runs `.js` files as ESM; engine test script uses `import`.
- The only verification tools are `npm run lint` and manual play (`npm run dev`), plus the engine's own Node assert script.

---

### Task 1: Pure engine (`lib/engine.js`) + Node assert tests

**Files:**
- Create: `src/games/wool-crush/lib/engine.js`
- Test: `src/games/wool-crush/lib/engine.test.js` (standalone Node script, run with `node`)

**Interfaces:**
- Consumes: nothing (pure, no imports).
- Produces (used by Board/Play):
  - `SIZE: number` (9), `COLORS: number` (7)
  - `createBoard(): number[][]` — 9×9 grid of color ids `0..6`, no pre-existing matches, at least one valid move.
  - `findMatches(board): Set<string>` — set of `"r,c"` keys in any horizontal/vertical run ≥ 3.
  - `areAdjacent(a, b): boolean` — `a`/`b` are `{r, c}`; true iff orthogonally adjacent.
  - `trySwap(board, a, b): number[][] | null` — new board if `a`,`b` adjacent AND the swap creates a match; else `null`.
  - `applyGravity(board): number[][]` — non-null tiles fall to the bottom of each column; `null` holes left at top.
  - `refill(board, gen?): number[][]` — replace every `null` with `gen()` (default random color).
  - `resolveBoard(board, gen?): { board, cleared, cascades, gained }` — cascade loop: clear → gravity → refill until no matches.
  - `hasValidMove(board): boolean` — any adjacent swap that would create a match. `false` ⇒ Game Over.
  - `stepScore(count, tier): number` — score for clearing `count` tiles at cascade `tier`.

- [ ] **Step 1: Write the failing test script**

Create `src/games/wool-crush/lib/engine.test.js`:

```js
import assert from "node:assert/strict";
import {
  SIZE,
  COLORS,
  createBoard,
  findMatches,
  areAdjacent,
  trySwap,
  applyGravity,
  refill,
  resolveBoard,
  hasValidMove,
  stepScore,
} from "./engine.js";

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ok - ${name}`);
}

// A board with a known horizontal triple of color 0 in row 0, cols 0..2.
// Rest is a safe checkerboard of colors 1 and 2 that has no runs >= 3.
function boardWithNoMatchesExcept(triple) {
  const b = Array.from({ length: SIZE }, (_, r) =>
    Array.from({ length: SIZE }, (_, c) => ((r + c) % 2 === 0 ? 1 : 2)),
  );
  if (triple) {
    b[0][0] = 0;
    b[0][1] = 0;
    b[0][2] = 0;
  }
  return b;
}

test("constants", () => {
  assert.equal(SIZE, 9);
  assert.equal(COLORS, 7);
});

test("areAdjacent", () => {
  assert.equal(areAdjacent({ r: 0, c: 0 }, { r: 0, c: 1 }), true);
  assert.equal(areAdjacent({ r: 0, c: 0 }, { r: 1, c: 0 }), true);
  assert.equal(areAdjacent({ r: 0, c: 0 }, { r: 1, c: 1 }), false);
  assert.equal(areAdjacent({ r: 0, c: 0 }, { r: 0, c: 2 }), false);
});

test("findMatches finds horizontal triple", () => {
  const b = boardWithNoMatchesExcept(true);
  const m = findMatches(b);
  assert.equal(m.size, 3);
  assert.ok(m.has("0,0") && m.has("0,1") && m.has("0,2"));
});

test("findMatches finds nothing on checkerboard", () => {
  const b = boardWithNoMatchesExcept(false);
  assert.equal(findMatches(b).size, 0);
});

test("findMatches finds vertical triple", () => {
  const b = boardWithNoMatchesExcept(false);
  b[0][0] = 5;
  b[1][0] = 5;
  b[2][0] = 5;
  const m = findMatches(b);
  assert.ok(m.has("0,0") && m.has("1,0") && m.has("2,0"));
});

test("trySwap returns null for non-adjacent", () => {
  const b = boardWithNoMatchesExcept(false);
  assert.equal(trySwap(b, { r: 0, c: 0 }, { r: 5, c: 5 }), null);
});

test("trySwap returns null when swap makes no match", () => {
  const b = boardWithNoMatchesExcept(false);
  // swapping two checkerboard neighbors never makes a run of 3
  assert.equal(trySwap(b, { r: 0, c: 0 }, { r: 0, c: 1 }), null);
});

test("trySwap returns new board when swap makes a match", () => {
  // Row 0: [1,0,1,...]; put a 1 above col 1 so swapping (0,1)<->(0,0)... build explicitly.
  const b = boardWithNoMatchesExcept(false);
  // Make a vertical pair of color 3 at col 2 rows 0,1 and a color 3 at (2,3);
  // swapping (2,3)<->(2,2) lines up col 2 rows 0,1,2 as 3,3,3.
  b[0][2] = 3;
  b[1][2] = 3;
  b[2][2] = 9; // temp distinct so no premature match
  b[2][3] = 3;
  const nb = trySwap(b, { r: 2, c: 3 }, { r: 2, c: 2 });
  assert.notEqual(nb, null);
  assert.ok(findMatches(nb).size >= 3);
  // original board is unchanged (purity)
  assert.equal(b[2][2], 9);
});

test("applyGravity drops tiles and holes to top", () => {
  const b = Array.from({ length: SIZE }, () => Array(SIZE).fill(1));
  b[8][0] = null;
  b[7][0] = null;
  const g = applyGravity(b);
  // column 0: two holes should end up at the TOP (rows 0,1 null), rest filled
  assert.equal(g[0][0], null);
  assert.equal(g[1][0], null);
  assert.equal(g[2][0], 1);
  assert.equal(g[8][0], 1);
});

test("refill fills holes using gen", () => {
  const b = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
  const r = refill(b, () => 4);
  assert.equal(r[0][0], 4);
  assert.equal(r[8][8], 4);
});

test("stepScore formula", () => {
  assert.equal(stepScore(3, 1), 30); // 3*10*1, no bonus
  assert.equal(stepScore(3, 2), 60); // 3*10*2
  assert.equal(stepScore(4, 1), 45); // 4*10*1 + (4-3)*5
  assert.equal(stepScore(5, 3), 160); // 5*10*3 + (5-3)*5
});

test("resolveBoard clears matches and leaves a stable board", () => {
  const b = boardWithNoMatchesExcept(true);
  const res = resolveBoard(b, () => 6); // refill with color 6
  assert.equal(findMatches(res.board).size, 0); // always stable at end
  assert.ok(res.cleared >= 3);
  assert.ok(res.cascades >= 1);
  assert.ok(res.gained > 0);
});

test("createBoard is clean and playable", () => {
  const b = createBoard();
  assert.equal(b.length, SIZE);
  assert.equal(b[0].length, SIZE);
  assert.equal(findMatches(b).size, 0);
  assert.equal(hasValidMove(b), true);
});

test("hasValidMove false on a locked board", () => {
  // Stripes by row: row value = r % COLORS. No horizontal run (neighbors differ by column? same row = same color => horizontal run!). Use gradient by (r*SIZE+c) to avoid runs, then assert a swap CAN help is false is hard; instead craft a tiny locked pattern:
  // Fill so that no two orthogonal neighbors share a color AND no swap creates 3.
  // A 3-color diagonal pattern (r+c)%3 has no runs of 3 and no single swap makes one.
  const b = Array.from({ length: SIZE }, (_, r) =>
    Array.from({ length: SIZE }, (_, c) => (r + c) % 3),
  );
  assert.equal(findMatches(b).size, 0);
  assert.equal(hasValidMove(b), false);
});

console.log(`\n${passed} tests passed`);
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node src/games/wool-crush/lib/engine.test.js`
Expected: FAIL — `Cannot find module './engine.js'` (the engine does not exist yet).

- [ ] **Step 3: Write the engine implementation**

Create `src/games/wool-crush/lib/engine.js`:

```js
// Pure, React-free match-3 engine for Wool Crush.
// A board is a SIZE x SIZE array of color ids (0..COLORS-1), or null for a hole.

export const SIZE = 9;
export const COLORS = 7;

function randColor() {
  return Math.floor(Math.random() * COLORS);
}

function cloneBoard(board) {
  return board.map((row) => row.slice());
}

function swapped(board, a, b) {
  const nb = cloneBoard(board);
  const tmp = nb[a.r][a.c];
  nb[a.r][a.c] = nb[b.r][b.c];
  nb[b.r][b.c] = tmp;
  return nb;
}

export function areAdjacent(a, b) {
  return Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;
}

export function findMatches(board) {
  const matched = new Set();
  // horizontal runs
  for (let r = 0; r < SIZE; r++) {
    let run = 1;
    for (let c = 1; c <= SIZE; c++) {
      const same =
        c < SIZE && board[r][c] != null && board[r][c] === board[r][c - 1];
      if (same) {
        run++;
      } else {
        if (run >= 3) for (let k = c - run; k < c; k++) matched.add(`${r},${k}`);
        run = 1;
      }
    }
  }
  // vertical runs
  for (let c = 0; c < SIZE; c++) {
    let run = 1;
    for (let r = 1; r <= SIZE; r++) {
      const same =
        r < SIZE && board[r][c] != null && board[r][c] === board[r - 1][c];
      if (same) {
        run++;
      } else {
        if (run >= 3) for (let k = r - run; k < r; k++) matched.add(`${k},${c}`);
        run = 1;
      }
    }
  }
  return matched;
}

export function trySwap(board, a, b) {
  if (!areAdjacent(a, b)) return null;
  const nb = swapped(board, a, b);
  if (findMatches(nb).size === 0) return null;
  return nb;
}

export function applyGravity(board) {
  const nb = cloneBoard(board);
  for (let c = 0; c < SIZE; c++) {
    let write = SIZE - 1;
    for (let r = SIZE - 1; r >= 0; r--) {
      if (nb[r][c] != null) {
        const val = nb[r][c];
        if (write !== r) {
          nb[write][c] = val;
          nb[r][c] = null;
        }
        write--;
      }
    }
    for (let r = write; r >= 0; r--) nb[r][c] = null;
  }
  return nb;
}

export function refill(board, gen = randColor) {
  const nb = cloneBoard(board);
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (nb[r][c] == null) nb[r][c] = gen();
    }
  }
  return nb;
}

// First clear ×1, each chained cascade ×2, ×3, …; +5 per tile beyond 3.
export function stepScore(count, tier) {
  const base = count * 10 * tier;
  const bonus = count > 3 ? (count - 3) * 5 : 0;
  return base + bonus;
}

export function resolveBoard(board, gen = randColor) {
  let b = cloneBoard(board);
  let cleared = 0;
  let cascades = 0;
  let gained = 0;
  for (;;) {
    const m = findMatches(b);
    if (m.size === 0) break;
    cascades++;
    gained += stepScore(m.size, cascades);
    cleared += m.size;
    for (const key of m) {
      const [r, c] = key.split(",").map(Number);
      b[r][c] = null;
    }
    b = applyGravity(b);
    b = refill(b, gen);
  }
  return { board: b, cleared, cascades, gained };
}

export function hasValidMove(board) {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (c + 1 < SIZE) {
        const nb = swapped(board, { r, c }, { r, c: c + 1 });
        if (findMatches(nb).size > 0) return true;
      }
      if (r + 1 < SIZE) {
        const nb = swapped(board, { r, c }, { r: r + 1, c });
        if (findMatches(nb).size > 0) return true;
      }
    }
  }
  return false;
}

export function createBoard() {
  let board;
  do {
    board = Array.from({ length: SIZE }, () =>
      Array.from({ length: SIZE }, () => randColor()),
    );
    let m = findMatches(board);
    let guard = 0;
    while (m.size > 0 && guard < 2000) {
      for (const key of m) {
        const [r, c] = key.split(",").map(Number);
        board[r][c] = randColor();
      }
      m = findMatches(board);
      guard++;
    }
  } while (!hasValidMove(board));
  return board;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node src/games/wool-crush/lib/engine.test.js`
Expected: PASS — every line prints `ok - …` and the final line reads `13 tests passed`.

- [ ] **Step 5: Lint**

Run: `npm run lint`
Expected: no errors for `src/games/wool-crush/lib/`.

- [ ] **Step 6: Commit**

```bash
git add src/games/wool-crush/lib/engine.js src/games/wool-crush/lib/engine.test.js
git commit -m "feat(wool-crush): pure match-3 engine with node assert tests"
```

---

### Task 2: High-score storage (`lib/storage.js`)

**Files:**
- Create: `src/games/wool-crush/lib/storage.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `loadHighScore(): number`, `saveHighScore(score: number): void`.

- [ ] **Step 1: Write the implementation**

Create `src/games/wool-crush/lib/storage.js`:

```js
const KEY = "wool-crush-highscore";

export function loadHighScore() {
  try {
    const raw = localStorage.getItem(KEY);
    const n = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

export function saveHighScore(score) {
  try {
    localStorage.setItem(KEY, String(Math.max(0, Math.floor(score))));
  } catch {
    /* ignore quota / unavailable storage */
  }
}
```

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: no errors for `storage.js`.

- [ ] **Step 3: Commit**

```bash
git add src/games/wool-crush/lib/storage.js
git commit -m "feat(wool-crush): localStorage high-score helpers"
```

---

### Task 3: Wool tile component (`components/WoolTile.jsx`)

**Files:**
- Create: `src/games/wool-crush/components/WoolTile.jsx`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces:
  - Default export `WoolTile` — props `{ colorId, selected, shaking, onClick }`. Renders a square button containing an SVG wool ball colored by `colorId`.
  - Named export `WOOL_COLORS: string[]` — the 7 fixed hex hues, indexed by color id.

- [ ] **Step 1: Write the component**

Create `src/games/wool-crush/components/WoolTile.jsx`:

```jsx
// 7 fixed hues chosen to stay distinct in both light and dark themes.
export const WOOL_COLORS = [
  "#E05757", // 0 red
  "#E8A93C", // 1 amber
  "#4F9D69", // 2 green
  "#4F86C6", // 3 blue
  "#9B6BC9", // 4 purple
  "#E07AAE", // 5 pink
  "#3FB6B0", // 6 teal
];

export default function WoolTile({ colorId, selected, shaking, onClick }) {
  const color = WOOL_COLORS[colorId] ?? "#888";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`wool ${colorId}`}
      className={`relative aspect-square w-full rounded-md transition-transform duration-150 will-change-transform ${
        selected
          ? "scale-110 z-10 ring-2 ring-white/90 shadow-[0_0_12px_rgba(255,255,255,0.5)]"
          : "hover:scale-105"
      } ${shaking ? "wool-shake" : ""}`}
    >
      <svg viewBox="0 0 100 100" className="wool-pop h-full w-full drop-shadow">
        <circle cx="50" cy="50" r="42" fill={color} />
        <g
          fill="none"
          stroke="rgba(0,0,0,0.18)"
          strokeWidth="3"
          strokeLinecap="round"
        >
          <ellipse cx="50" cy="50" rx="42" ry="19" transform="rotate(32 50 50)" />
          <ellipse cx="50" cy="50" rx="42" ry="19" transform="rotate(-32 50 50)" />
          <path d="M18 44 Q50 22 82 48" />
          <path d="M18 58 Q50 40 82 62" />
        </g>
        <ellipse cx="37" cy="35" rx="11" ry="6" fill="rgba(255,255,255,0.35)" />
      </svg>
    </button>
  );
}
```

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: no errors for `WoolTile.jsx`.

- [ ] **Step 3: Commit**

```bash
git add src/games/wool-crush/components/WoolTile.jsx
git commit -m "feat(wool-crush): SVG wool tile component with 7 fixed hues"
```

---

### Task 4: Board component (`components/Board.jsx`)

**Files:**
- Create: `src/games/wool-crush/components/Board.jsx`

**Interfaces:**
- Consumes:
  - engine: `createBoard`, `trySwap`, `resolveBoard`, `hasValidMove`, `areAdjacent`, `SIZE`
  - `WoolTile` (default export)
- Produces:
  - Default export `Board` — props `{ onGained(delta:number):void, onGameOver():void }`. Owns its own `board`, `selected`, `busy`, and `shaking` state. Reports each cascade's `gained` up via `onGained` and calls `onGameOver()` once no valid move remains. Remounts fresh (new random board) whenever its React `key` changes.

The keying trick for the "pop" animation: each tile's React `key` includes its color id, so when a cell's color changes the tile remounts and its `wool-pop` mount animation replays. Unchanged cells keep their key and do not animate. Shake is a transient class on the two swapped cells for an invalid swap.

- [ ] **Step 1: Write the component**

Create `src/games/wool-crush/components/Board.jsx`:

```jsx
import { useState } from "react";
import WoolTile from "./WoolTile";
import {
  SIZE,
  areAdjacent,
  createBoard,
  hasValidMove,
  resolveBoard,
  trySwap,
} from "../lib/engine";

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

export default function Board({ onGained, onGameOver }) {
  const [board, setBoard] = useState(() => createBoard());
  const [selected, setSelected] = useState(null); // { r, c } | null
  const [busy, setBusy] = useState(false);
  const [shaking, setShaking] = useState(null); // "r,c|r,c" | null

  async function handleClick(r, c) {
    if (busy) return;
    const cell = { r, c };

    if (!selected) {
      setSelected(cell);
      return;
    }
    if (selected.r === r && selected.c === c) {
      setSelected(null);
      return;
    }
    if (!areAdjacent(selected, cell)) {
      setSelected(cell); // re-target
      return;
    }

    const a = selected;
    setSelected(null);
    const swapBoard = trySwap(board, a, cell);

    if (!swapBoard) {
      const key = `${a.r},${a.c}|${cell.r},${cell.c}`;
      setShaking(key);
      await delay(300);
      setShaking(null);
      return;
    }

    setBusy(true);
    setBoard(swapBoard); // show the swap
    await delay(160);
    const { board: resolved, gained } = resolveBoard(swapBoard);
    if (gained > 0) onGained(gained);
    setBoard(resolved);
    await delay(160);
    if (!hasValidMove(resolved)) onGameOver();
    setBusy(false);
  }

  function isShaking(r, c) {
    if (!shaking) return false;
    return shaking.split("|").includes(`${r},${c}`);
  }

  return (
    <div className="mx-auto w-full max-w-[min(92vw,560px)] select-none">
      <style>{`
        @keyframes woolPop {
          0% { transform: translateY(-14%) scale(0.6); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        .wool-pop { animation: woolPop 180ms ease-out; }
        @keyframes woolShake {
          0%,100% { transform: translateX(0); }
          25% { transform: translateX(-14%); }
          75% { transform: translateX(14%); }
        }
        .wool-shake { animation: woolShake 260ms ease-in-out; }
      `}</style>
      <div
        className="grid gap-1 rounded-xl border border-arena-border bg-arena-surface p-2"
        style={{ gridTemplateColumns: `repeat(${SIZE}, minmax(0, 1fr))` }}
      >
        {board.map((row, r) =>
          row.map((colorId, c) => (
            <WoolTile
              key={`${r}-${c}-${colorId}`}
              colorId={colorId}
              selected={!!selected && selected.r === r && selected.c === c}
              shaking={isShaking(r, c)}
              onClick={() => handleClick(r, c)}
            />
          )),
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: no errors for `Board.jsx`.

- [ ] **Step 3: Commit**

```bash
git add src/games/wool-crush/components/Board.jsx
git commit -m "feat(wool-crush): interactive board with swap + cascade animation"
```

---

### Task 5: Play page (`pages/Play.jsx`)

**Files:**
- Create: `src/games/wool-crush/pages/Play.jsx`

**Interfaces:**
- Consumes: `Board` (default), `loadHighScore`/`saveHighScore` (storage), `useT`.
- Produces: default export `Play` — the route screen. Owns `score`, `highScore`, `gameOver`, `newRecord`, and a `roundKey` used to remount `Board` on restart.

- [ ] **Step 1: Write the page**

Create `src/games/wool-crush/pages/Play.jsx`:

```jsx
import { useState } from "react";
import { useT } from "../../../lib/i18n";
import Board from "../components/Board";
import { loadHighScore, saveHighScore } from "../lib/storage";

export default function Play() {
  const { t } = useT();
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => loadHighScore());
  const [gameOver, setGameOver] = useState(false);
  const [newRecord, setNewRecord] = useState(false);
  const [roundKey, setRoundKey] = useState(0);

  function handleGained(delta) {
    setScore((s) => s + delta);
  }

  function handleGameOver() {
    setGameOver(true);
    setScore((finalScore) => {
      if (finalScore > highScore) {
        saveHighScore(finalScore);
        setHighScore(finalScore);
        setNewRecord(true);
      }
      return finalScore;
    });
  }

  function playAgain() {
    setScore(0);
    setGameOver(false);
    setNewRecord(false);
    setRoundKey((k) => k + 1);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-6 text-center">
        <p className="text-[10px] uppercase tracking-[0.4em] text-arena-amber">
          {t("wool.tag")}
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
          {t("wool.title")}
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-arena-muted">
          {t("wool.how_to")}
        </p>
      </header>

      <div className="mb-5 flex items-center justify-center gap-4">
        <div className="rounded-lg border border-arena-border bg-arena-surface px-5 py-2 text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-arena-muted">
            {t("wool.score")}
          </p>
          <p className="font-display text-2xl">{score}</p>
        </div>
        <div className="rounded-lg border border-arena-border bg-arena-surface px-5 py-2 text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-arena-muted">
            {t("wool.high_score")}
          </p>
          <p className="font-display text-2xl text-arena-amber">{highScore}</p>
        </div>
      </div>

      <div className="relative">
        <Board key={roundKey} onGained={handleGained} onGameOver={handleGameOver} />

        {gameOver && (
          <div className="absolute inset-0 grid place-items-center rounded-xl bg-arena-bg/80 backdrop-blur-sm">
            <div className="w-[min(90%,320px)] rounded-xl border border-arena-border bg-arena-surface p-6 text-center">
              <p className="text-[10px] uppercase tracking-[0.3em] text-arena-muted">
                {t("wool.game_over")}
              </p>
              <p className="mt-2 text-sm text-arena-muted">
                {t("wool.final_score")}
              </p>
              <p className="font-display text-4xl">{score}</p>
              {newRecord && (
                <p className="mt-2 text-sm font-semibold text-arena-amber">
                  {t("wool.new_record")}
                </p>
              )}
              <button
                onClick={playAgain}
                className="mt-5 rounded-md border border-arena-amber/60 bg-arena-amber/15 px-8 py-2.5 font-display text-sm uppercase tracking-[0.3em] text-arena-amber hover:bg-arena-amber/25"
              >
                {t("wool.play_again")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: no errors for `Play.jsx`.

- [ ] **Step 3: Commit**

```bash
git add src/games/wool-crush/pages/Play.jsx
git commit -m "feat(wool-crush): play screen with score HUD and game-over overlay"
```

---

### Task 6: Layout + routing module (`components/Layout.jsx`, `index.jsx`)

**Files:**
- Create: `src/games/wool-crush/components/Layout.jsx`
- Create: `src/games/wool-crush/index.jsx`

**Interfaces:**
- Consumes: `useAuth`, `useT`, `LanguageSwitcher`, `ThemeToggle`, `Play`.
- Produces: default export `WoolCrush` (the game's nested `<Routes>`), mirroring the `lucky-wheel` module shape.

- [ ] **Step 1: Write the Layout** (modeled on `lucky-wheel/components/Layout.jsx`)

Create `src/games/wool-crush/components/Layout.jsx`:

```jsx
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../../lib/AuthContext";
import { useT } from "../../../lib/i18n";
import LanguageSwitcher from "../../../components/LanguageSwitcher";
import ThemeToggle from "../../../components/ThemeToggle";

export default function WoolCrushLayout({ user }) {
  const { isAdmin } = useAuth();
  const { t } = useT();
  const initials = (user?.name || "?")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-arena-bg text-arena-text">
      <header className="sticky top-0 z-30 border-b border-arena-border bg-arena-bg/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:gap-8 sm:px-6">
          <NavLink to="/" className="flex shrink-0 items-center gap-2" title="Back to Hub">
            <span className="h-2 w-2 rounded-full bg-arena-amber shadow-[0_0_8px_#E8A93C]" />
            <span className="font-display text-lg font-semibold tracking-tight">
              LNP Hub<span className="text-arena-amber">.</span>
              <span className="ml-2 align-middle text-[10px] font-normal uppercase tracking-[0.3em] text-arena-muted">
                {t("wool.brand_tag")}
              </span>
            </span>
          </NavLink>

          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle variant="nav" />
            <LanguageSwitcher variant="nav" />
            {isAdmin && (
              <NavLink
                to="/admin"
                className="hidden items-center gap-2 rounded-md border border-arena-amber/30 bg-arena-amber/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-arena-amber hover:bg-arena-amber/25 sm:inline-flex"
              >
                Admin
              </NavLink>
            )}
            <div
              title={user?.name}
              className="grid h-9 w-9 place-items-center overflow-hidden rounded-full border border-arena-border bg-arena-card text-xs font-semibold"
            >
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                initials
              )}
            </div>
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Write the routing module** (modeled on `lucky-wheel/index.jsx`)

Create `src/games/wool-crush/index.jsx`:

```jsx
import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Play from "./pages/Play";
import { useAuth } from "../../lib/AuthContext";

export default function WoolCrush() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route element={<Layout user={user} />}>
        <Route index element={<Play />} />
        <Route path="*" element={<Navigate to="" replace />} />
      </Route>
    </Routes>
  );
}
```

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: no errors for the new files.

- [ ] **Step 4: Commit**

```bash
git add src/games/wool-crush/components/Layout.jsx src/games/wool-crush/index.jsx
git commit -m "feat(wool-crush): game layout and nested routes"
```

---

### Task 7: Wire into the shell — `App.jsx`, `Catalog.jsx`, `i18n.jsx`

**Files:**
- Modify: `src/App.jsx` (add lazy import + route)
- Modify: `src/pages/Catalog.jsx` (add card to `miniGames`)
- Modify: `src/lib/i18n.jsx` (add `wool.*` + `catalog.wool_*` keys)

**Interfaces:**
- Consumes: the `WoolCrush` default export from Task 6.
- Produces: a reachable `/wool-crush` route + a Catalog card. Terminal deliverable — the game is playable end to end.

- [ ] **Step 1: Add the lazy import in `src/App.jsx`**

After the `CoworkingDay` lazy import (line 15), add:

```jsx
const WoolCrush = lazy(() => import("./games/wool-crush"));
```

- [ ] **Step 2: Add the route in `src/App.jsx`**

After the `/coworking-day/*` `<Route>` block (ends line 92), add:

```jsx
              <Route
                path="/wool-crush/*"
                element={
                  <Suspense fallback={<GameFallback />}>
                    <WoolCrush />
                  </Suspense>
                }
              />
```

- [ ] **Step 3: Add the Catalog card in `src/pages/Catalog.jsx`**

Add this object to the `miniGames` array (e.g. after the `lucky-wheel` entry, before `coworking-day`):

```jsx
    {
      slug: "wool-crush",
      name: t("catalog.wool_name"),
      description: t("catalog.wool_desc"),
      path: "/wool-crush",
      icon: "🧶",
      accent: "amber",
    },
```

- [ ] **Step 4: Add i18n keys in `src/lib/i18n.jsx`**

Add these entries to the flat `dict` (place the `wool.*` block near the `lw.*` block, and the two `catalog.wool_*` keys near `catalog.lw_*`):

```js
  "wool.brand_tag": { en: "Wool Crush", vi: "Xếp Len", ja: "ウールクラッシュ" },
  "wool.tag": { en: "◆ Wool Crush", vi: "◆ Xếp Len", ja: "◆ ウールクラッシュ" },
  "wool.title": { en: "Wool Crush", vi: "Xếp Len", ja: "ウールクラッシュ" },
  "wool.how_to": {
    en: "Tap a wool ball, then a neighbor, to swap. Line up 3 or more to clear them. Endless — play until no moves are left.",
    vi: "Chạm một cuộn len, rồi chạm cuộn kề bên để đổi chỗ. Xếp 3 cuộn trở lên cùng màu để xoá. Chơi tới khi hết nước đi.",
    ja: "毛糸玉をタップし、隣をタップして入れ替え。3つ以上そろえて消そう。手がなくなるまで続く無限モード。",
  },
  "wool.score": { en: "Score", vi: "Điểm", ja: "スコア" },
  "wool.high_score": { en: "Best", vi: "Kỷ lục", ja: "ベスト" },
  "wool.game_over": { en: "Game Over", vi: "Kết thúc", ja: "ゲームオーバー" },
  "wool.final_score": { en: "Final score", vi: "Điểm cuối", ja: "最終スコア" },
  "wool.new_record": { en: "New record!", vi: "Kỷ lục mới!", ja: "新記録！" },
  "wool.play_again": { en: "Play again", vi: "Chơi lại", ja: "もう一度" },
  "catalog.wool_name": { en: "Wool Crush", vi: "Xếp Len", ja: "ウールクラッシュ" },
  "catalog.wool_desc": {
    en: "Match 3 or more wool balls in this endless puzzle. Beat your best score.",
    vi: "Xếp 3 cuộn len trở lên trong trò giải đố vô tận. Vượt qua điểm cao nhất của bạn.",
    ja: "毛糸玉を3つ以上そろえる無限パズル。自己ベストを更新しよう。",
  },
```

- [ ] **Step 5: Lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 6: Manual verification**

Run: `npm run dev`, open the Hub, confirm:
1. A "Wool Crush" card appears under Mini Games and links to `/wool-crush`.
2. The board renders a 9×9 grid of SVG wool balls with no initial matches.
3. Tapping a ball highlights it; tapping an adjacent ball swaps — a matching swap clears + cascades and the score rises; a non-matching swap shakes and reverts.
4. Language switch updates all Wool Crush text (en/vi/ja); dark/light both look right.
5. Play down to Game Over → overlay shows final score, "New record!" when beaten, and **Play again** starts a fresh board with score reset.
6. Reload the page → the Best (high score) persists.

- [ ] **Step 7: Commit**

```bash
git add src/App.jsx src/pages/Catalog.jsx src/lib/i18n.jsx
git commit -m "feat(wool-crush): register route, catalog card, and i18n keys"
```

---

## Self-Review

**Spec coverage:**
- localStorage only, no DB → Tasks 2, 5 (no Supabase touched). ✓
- Endless / Game Over on no valid move → `hasValidMove` (Task 1), wired in Board/Play (Tasks 4, 5). ✓
- 9×9, 7 colors → `SIZE`/`COLORS` (Task 1), `WOOL_COLORS` (Task 3). ✓
- Plain 3+ matches, no special tiles → `findMatches`/`resolveBoard` (Task 1). ✓
- Hand-drawn SVG wool balls → `WoolTile` (Task 3). ✓
- Tap-select → tap-adjacent swap, invalid reverts → Board (Task 4). ✓
- Cascade fall + refill + chained scoring → `resolveBoard`/`stepScore` (Task 1). ✓
- Score + high score + Game Over overlay + Play Again + New record → Play (Task 5). ✓
- i18n en/vi/ja, `arena-*` tokens → Tasks 5, 6, 7. ✓
- Catalog card + App route → Task 7. ✓

**Placeholder scan:** No TBD/TODO; every code step shows complete code. ✓

**Type consistency:** Board consumes `createBoard/trySwap/resolveBoard/hasValidMove/areAdjacent/SIZE` exactly as exported in Task 1; Play consumes `Board`'s `onGained`/`onGameOver` props and `loadHighScore`/`saveHighScore` exactly as defined in Tasks 2, 4; `WOOL_COLORS` indexed by color id matches `COLORS = 7`. Scoring: `stepScore` used identically in engine and asserted in test. ✓

**Note on spec refinement:** the spec's "a run longer than 3 gives +5 bonus per extra tile" is implemented per cascade step as `count > 3 ? (count-3)*5 : 0` (bonus on the step's total matched count, not per individual run) — a deterministic, testable interpretation. Falling animation is a lightweight per-tile "pop" on change (via React key = position+color) rather than physically-tracked descent, keeping scope reasonable per the spec's "CSS transitions, no external library" constraint.
