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

// A checkerboard of colors 1 and 2 has no runs >= 3; optionally add a
// horizontal triple of color 0 in row 0, cols 0..2.
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
  assert.equal(trySwap(b, { r: 0, c: 0 }, { r: 0, c: 1 }), null);
});

test("trySwap returns new board when swap makes a match", () => {
  const b = boardWithNoMatchesExcept(false);
  b[0][2] = 3;
  b[1][2] = 3;
  b[2][2] = 9; // temp distinct so no premature match
  b[2][3] = 3;
  const nb = trySwap(b, { r: 2, c: 3 }, { r: 2, c: 2 });
  assert.notEqual(nb, null);
  assert.ok(findMatches(nb).size >= 3);
  assert.equal(b[2][2], 9); // original board unchanged (purity)
});

test("applyGravity drops tiles and holes to top", () => {
  const b = Array.from({ length: SIZE }, () => Array(SIZE).fill(1));
  b[8][0] = null;
  b[7][0] = null;
  const g = applyGravity(b);
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
  assert.equal(stepScore(3, 1), 30);
  assert.equal(stepScore(3, 2), 60);
  assert.equal(stepScore(4, 1), 45);
  assert.equal(stepScore(5, 3), 160);
});

test("resolveBoard clears matches and leaves a stable board", () => {
  const b = boardWithNoMatchesExcept(true);
  // Cycling gen (3,4,5,6,…) so refilled cells never re-form a run.
  let n = 0;
  const gen = () => 3 + (n++ % 4);
  const res = resolveBoard(b, gen);
  assert.equal(findMatches(res.board).size, 0);
  assert.ok(res.cleared >= 3);
  assert.equal(res.cascades, 1);
  assert.equal(res.gained, 30); // stepScore(3, 1)
});

test("createBoard is clean and playable", () => {
  const b = createBoard();
  assert.equal(b.length, SIZE);
  assert.equal(b[0].length, SIZE);
  assert.equal(findMatches(b).size, 0);
  assert.equal(hasValidMove(b), true);
});

test("hasValidMove false on a locked board", () => {
  const b = Array.from({ length: SIZE }, (_, r) =>
    Array.from({ length: SIZE }, (_, c) => (r + c) % 3),
  );
  assert.equal(findMatches(b).size, 0);
  assert.equal(hasValidMove(b), false);
});

console.log(`\n${passed} tests passed`);
