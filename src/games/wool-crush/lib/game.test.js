import assert from "node:assert/strict";
import {
  MAX_COLORS,
  MAX_LEN,
  MIN_CROSS_MS,
  sequenceLength,
  colorCount,
  crossMs,
  levelScore,
  shuffle,
  makeSequence,
} from "./game.js";

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ok - ${name}`);
}

// Deterministic PRNG for reproducible tests.
function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

test("sequenceLength grows and caps at MAX_LEN", () => {
  assert.equal(sequenceLength(1), 3);
  assert.equal(sequenceLength(2), 4);
  assert.equal(sequenceLength(6), 8);
  assert.equal(sequenceLength(100), MAX_LEN);
});

test("colorCount grows every 2 levels and caps at MAX_COLORS", () => {
  assert.equal(colorCount(1), 3);
  assert.equal(colorCount(2), 3);
  assert.equal(colorCount(3), 4);
  assert.equal(colorCount(100), MAX_COLORS);
});

test("crossMs shrinks and floors at MIN_CROSS_MS", () => {
  assert.equal(crossMs(1), 9000);
  assert.equal(crossMs(2), 8500);
  assert.equal(crossMs(100), MIN_CROSS_MS);
});

test("levelScore = base + time bonus", () => {
  assert.equal(levelScore(1, 0), 100);
  assert.equal(levelScore(2, 1000), 220); // 200 + round(1000/50)
  assert.equal(levelScore(3, -50), 300); // negative remaining clamped to 0 bonus
});

test("shuffle returns a permutation (same multiset)", () => {
  const src = [0, 1, 2, 3, 4, 5, 6, 7];
  const out = shuffle(src, seeded(7));
  assert.equal(out.length, src.length);
  assert.deepEqual([...out].sort(), [...src].sort());
  assert.deepEqual(src, [0, 1, 2, 3, 4, 5, 6, 7]); // original untouched
});

test("makeSequence: length, color range, crossMs, tray = shuffle of sequence", () => {
  const level = 4;
  const { sequence, tray, length, colors, crossMs: cm } = makeSequence(
    level,
    seeded(42),
  );
  assert.equal(length, sequenceLength(level)); // 6
  assert.equal(colors, colorCount(level)); // 4
  assert.equal(cm, crossMs(level));
  assert.equal(sequence.length, length);
  assert.ok(sequence.every((c) => c >= 0 && c < colors));
  assert.deepEqual([...tray].sort(), [...sequence].sort());
});

console.log(`\n${passed} tests passed`);
