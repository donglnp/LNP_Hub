// Pure, React-free logic for Wool Crush (dragon color-sequence game).
// The palette (colors.js) has >= MAX_COLORS entries; the game uses the first MAX_COLORS.
export const MAX_COLORS = 6;
export const START_LIVES = 3;
export const MAX_LEN = 8;
export const MIN_CROSS_MS = 4000;

// Difficulty curve (level is 1-indexed).
export function sequenceLength(level) {
  return Math.min(MAX_LEN, 3 + (level - 1));
}

export function colorCount(level) {
  return Math.min(MAX_COLORS, 3 + Math.floor((level - 1) / 2));
}

export function crossMs(level) {
  return Math.max(MIN_CROSS_MS, 9000 - (level - 1) * 500);
}

export function levelScore(level, remainingMs) {
  const base = 100 * level;
  const timeBonus = Math.max(0, Math.round(remainingMs / 50));
  return base + timeBonus;
}

// Fisher–Yates with injectable rand (0 <= rand() < 1).
export function shuffle(arr, rand = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const t = a[i];
    a[i] = a[j];
    a[j] = t;
  }
  return a;
}

export function makeSequence(level, rand = Math.random) {
  const len = sequenceLength(level);
  const colors = colorCount(level);
  const sequence = Array.from({ length: len }, () =>
    Math.floor(rand() * colors),
  );
  const tray = shuffle(sequence, rand);
  return { sequence, tray, length: len, colors, crossMs: crossMs(level) };
}
