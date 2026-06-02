const OPTIONS_KEY = "lucky-wheel-options";
const HISTORY_KEY = "lucky-wheel-history";

// Rich lucky palette — saturated red/gold/orange tones that pop on dark without glaring
export const PALETTE = [
  "#E05757", "#E8A93C", "#C9404A", "#D98E2B",
  "#B83A4B", "#E8B14A", "#D45A6E", "#E07A3C",
  "#C44A3A", "#D9A845", "#A83850", "#E89058",
];

export const DEFAULT_OPTIONS = [
  "An", "Bình", "Cường", "Dung", "Hà", "Khánh", "Minh", "Trang",
];

export function loadOptions(userId) {
  if (!userId) return DEFAULT_OPTIONS.slice();
  try {
    const raw = localStorage.getItem(`${OPTIONS_KEY}:${userId}`);
    if (!raw) return DEFAULT_OPTIONS.slice();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) && arr.length >= 2 ? arr : DEFAULT_OPTIONS.slice();
  } catch {
    return DEFAULT_OPTIONS.slice();
  }
}

export function saveOptions(userId, options) {
  if (!userId) return;
  localStorage.setItem(`${OPTIONS_KEY}:${userId}`, JSON.stringify(options));
}

export function colorFor(index) {
  return PALETTE[index % PALETTE.length];
}

export function pickRandomIndex(n) {
  return Math.floor(Math.random() * n);
}

export function loadHistory(userId) {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(`${HISTORY_KEY}:${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function pushHistory(userId, entry) {
  if (!userId) return [];
  const arr = loadHistory(userId);
  const next = [entry, ...arr].slice(0, 50);
  localStorage.setItem(`${HISTORY_KEY}:${userId}`, JSON.stringify(next));
  return next;
}

export function clearHistory(userId) {
  if (!userId) return;
  localStorage.removeItem(`${HISTORY_KEY}:${userId}`);
}
