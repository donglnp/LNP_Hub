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
  // Guard: random refills terminate almost surely, but cap cascades so a
  // pathological chain can never lock the UI.
  while (cascades < 500) {
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
