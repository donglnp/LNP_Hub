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
