const KEY = "wool-crush-progress";

export function loadBest() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { highScore: 0, bestLevel: 0 };
    const o = JSON.parse(raw);
    return {
      highScore: Number.isFinite(o?.highScore) ? o.highScore : 0,
      bestLevel: Number.isFinite(o?.bestLevel) ? o.bestLevel : 0,
    };
  } catch {
    return { highScore: 0, bestLevel: 0 };
  }
}

export function saveBest({ highScore, bestLevel }) {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        highScore: Math.max(0, Math.floor(highScore || 0)),
        bestLevel: Math.max(0, Math.floor(bestLevel || 0)),
      }),
    );
  } catch {
    /* ignore quota / unavailable storage */
  }
}
