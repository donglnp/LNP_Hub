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
