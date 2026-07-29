import { useEffect, useRef, useState } from "react";
import { useT } from "../../../lib/i18n";
import Dragon from "../components/Dragon";
import Tray from "../components/Tray";
import { levelScore, makeSequence, START_LIVES } from "../lib/game";
import { loadBest, saveBest } from "../lib/storage";

export default function Play() {
  const { t } = useT();

  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(START_LIVES);
  const [phase, setPhase] = useState("playing"); // playing | cleared | escaped | gameover
  const [sequence, setSequence] = useState([]);
  const [tray, setTray] = useState([]); // [{ id, color, used }]
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);
  const [shakeId, setShakeId] = useState(null);
  const [best, setBest] = useState(() => loadBest());
  const [newRecord, setNewRecord] = useState(false);
  const [lastGain, setLastGain] = useState(0);
  const [crossMsView, setCrossMsView] = useState(0); // crossMs for the current level (render)
  const [reachedThisRun, setReachedThisRun] = useState(1); // level reached this run (game-over screen)

  const levelRef = useRef(1);
  const livesRef = useRef(START_LIVES);
  const scoreRef = useRef(0);
  const bestReachedRef = useRef(1);
  const startTimeRef = useRef(0);
  const crossMsRef = useRef(0);
  const escapeTimerRef = useRef(null);
  const phaseTimerRef = useRef(null);
  const rafRef = useRef(0);
  const startLevelRef = useRef(() => {}); // breaks the startLevel<->handleEscape cycle

  function clearTimers() {
    clearTimeout(escapeTimerRef.current);
    clearTimeout(phaseTimerRef.current);
    cancelAnimationFrame(rafRef.current);
  }

  function endGame() {
    clearTimers();
    const finalScore = scoreRef.current;
    const reached = bestReachedRef.current;
    const beatScore = finalScore > best.highScore;
    if (beatScore || reached > best.bestLevel) {
      const next = {
        highScore: Math.max(best.highScore, finalScore),
        bestLevel: Math.max(best.bestLevel, reached),
      };
      saveBest(next);
      setBest(next);
    }
    setNewRecord(beatScore);
    setReachedThisRun(reached);
    setPhase("gameover");
  }

  function handleEscape() {
    const nl = livesRef.current - 1;
    livesRef.current = nl;
    setLives(nl);
    setPhase("escaped");
    phaseTimerRef.current = setTimeout(() => {
      if (nl <= 0) endGame();
      else startLevelRef.current(levelRef.current);
    }, 1200);
  }

  function startLevel(lvl) {
    clearTimers();
    levelRef.current = lvl;
    bestReachedRef.current = Math.max(bestReachedRef.current, lvl);
    const { sequence: seq, tray: tr, crossMs } = makeSequence(lvl);
    crossMsRef.current = crossMs;
    setCrossMsView(crossMs);
    setLevel(lvl);
    setSequence(seq);
    setTray(tr.map((color, id) => ({ id, color, used: false })));
    setProgress(0);
    setShakeId(null);
    setPhase("playing");
    setRunning(false); // snap the dragon back to the start
    // Kick off the crossing on the next frame so the transition applies,
    // and arm the escape timeout aligned with the animation.
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(() => {
        setRunning(true);
        startTimeRef.current = Date.now();
        escapeTimerRef.current = setTimeout(handleEscape, crossMs);
      });
    });
  }

  // Keep the ref pointing at the latest startLevel (used by handleEscape's
  // deferred retry, which fires long after render).
  useEffect(() => {
    startLevelRef.current = startLevel;
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    startLevel(1);
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleDefeat() {
    clearTimeout(escapeTimerRef.current);
    cancelAnimationFrame(rafRef.current);
    const remaining = Math.max(
      0,
      crossMsRef.current - (Date.now() - startTimeRef.current),
    );
    const gained = levelScore(levelRef.current, remaining);
    scoreRef.current += gained;
    setScore(scoreRef.current);
    setLastGain(gained);
    setPhase("cleared");
    phaseTimerRef.current = setTimeout(
      () => startLevel(levelRef.current + 1),
      1000,
    );
  }

  function handlePick(id) {
    if (phase !== "playing") return;
    const tile = tray.find((x) => x.id === id);
    if (!tile || tile.used) return;
    if (tile.color !== sequence[progress]) {
      setShakeId(id);
      setTimeout(() => setShakeId((s) => (s === id ? null : s)), 320);
      return;
    }
    setTray((ts) => ts.map((x) => (x.id === id ? { ...x, used: true } : x)));
    const next = progress + 1;
    setProgress(next);
    if (next >= sequence.length) handleDefeat();
  }

  function playAgain() {
    scoreRef.current = 0;
    livesRef.current = START_LIVES;
    bestReachedRef.current = 1;
    setScore(0);
    setLives(START_LIVES);
    setNewRecord(false);
    startLevel(1);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-10">
      <style>{`
        @keyframes woolShake {0%,100%{transform:translateX(0)}25%{transform:translateX(-18%)}75%{transform:translateX(18%)}}
        .wool-shake{animation:woolShake 300ms ease-in-out}
        @keyframes woolNext {0%,100%{transform:scale(1)}50%{transform:scale(1.28)}}
        .wool-next{animation:woolNext 700ms ease-in-out infinite}
      `}</style>

      <header className="mb-4 text-center">
        <p className="text-[10px] uppercase tracking-[0.4em] text-arena-amber">
          {t("wool.tag")}
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold sm:text-3xl">
          {t("wool.title")}
        </h1>
        <p className="mx-auto mt-1 max-w-md text-xs text-arena-muted">
          {t("wool.how_to")}
        </p>
      </header>

      {/* HUD */}
      <div className="mb-3 flex items-center justify-between gap-3 text-sm">
        <span className="rounded-md border border-arena-border bg-arena-surface px-3 py-1">
          {t("wool.level")} <b className="text-arena-amber">{level}</b>
        </span>
        <span className="rounded-md border border-arena-border bg-arena-surface px-3 py-1">
          {t("wool.score")} <b>{score}</b>
        </span>
        <span className="rounded-md border border-arena-border bg-arena-surface px-3 py-1 tracking-widest">
          {Array.from({ length: START_LIVES }, (_, i) => (
            <span key={i} className={i < lives ? "" : "opacity-25"}>
              ❤️
            </span>
          ))}
        </span>
      </div>

      {/* Play area */}
      <div className="relative rounded-xl border border-arena-border bg-arena-surface">
        <Dragon
          sequence={sequence}
          progress={progress}
          running={running}
          crossMs={crossMsView}
        />

        {/* time bar */}
        <div className="h-2 w-full overflow-hidden bg-arena-card">
          <div
            className="h-full bg-arena-amber"
            style={{
              width: running ? "0%" : "100%",
              transition: running ? `width ${crossMsView}ms linear` : "none",
            }}
          />
        </div>

        <div className="p-4 sm:p-6">
          <Tray
            items={tray}
            shakeId={shakeId}
            onPick={handlePick}
            disabled={phase !== "playing"}
          />
        </div>

        {/* transient overlays */}
        {phase === "cleared" && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="rounded-xl bg-arena-bg/70 px-6 py-4 text-center backdrop-blur-sm">
              <p className="font-display text-2xl">🐉💥 {t("wool.dragon_down")}</p>
              <p className="mt-1 text-arena-amber">+{lastGain}</p>
            </div>
          </div>
        )}
        {phase === "escaped" && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="rounded-xl bg-arena-bg/70 px-6 py-4 text-center backdrop-blur-sm">
              <p className="font-display text-2xl">{t("wool.escaped")}</p>
              <p className="mt-1 text-arena-red">−1 ❤️</p>
            </div>
          </div>
        )}
        {phase === "gameover" && (
          <div className="absolute inset-0 grid place-items-center rounded-xl bg-arena-bg/85 backdrop-blur-sm">
            <div className="w-[min(90%,320px)] rounded-xl border border-arena-border bg-arena-surface p-6 text-center">
              <p className="text-[10px] uppercase tracking-[0.3em] text-arena-muted">
                {t("wool.game_over")}
              </p>
              <p className="mt-2 text-sm text-arena-muted">
                {t("wool.final_score")}
              </p>
              <p className="font-display text-4xl">{score}</p>
              <p className="mt-1 text-sm text-arena-muted">
                {t("wool.reached_level", { n: reachedThisRun })}
              </p>
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

      {/* best row */}
      <div className="mt-4 flex items-center justify-center gap-6 text-xs text-arena-muted">
        <span>
          {t("wool.high_score")}: <b className="text-arena-amber">{best.highScore}</b>
        </span>
        <span>
          {t("wool.best_level")}: <b className="text-arena-amber">{best.bestLevel}</b>
        </span>
      </div>
    </div>
  );
}
