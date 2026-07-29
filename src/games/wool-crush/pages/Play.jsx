import { useRef, useState } from "react";
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
  const scoreRef = useRef(0);

  function handleGained(delta) {
    scoreRef.current += delta;
    setScore(scoreRef.current);
  }

  function handleGameOver() {
    const finalScore = scoreRef.current;
    setGameOver(true);
    if (finalScore > highScore) {
      saveHighScore(finalScore);
      setHighScore(finalScore);
      setNewRecord(true);
    }
  }

  function playAgain() {
    scoreRef.current = 0;
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
