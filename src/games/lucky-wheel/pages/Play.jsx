import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../../lib/AuthContext";
import { useT } from "../../../lib/i18n";
import Wheel from "../components/Wheel";
import {
  clearHistory,
  colorFor,
  loadHistory,
  loadOptions,
  pickRandomIndex,
  pushHistory,
  saveOptions,
} from "../lib/data";
import { fetchUserNames } from "../lib/users";

const SPIN_TURNS = 6;
const DURATION = 4500;

export default function Play() {
  const { user } = useAuth();
  const { t, lang } = useT();
  const userId = user?.id || "guest";

  const [options, setOptions] = useState([]);
  const [optionsText, setOptionsText] = useState("");
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState(() => loadHistory(userId));
  const [loadingUsers, setLoadingUsers] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    setHistory(loadHistory(userId));
    let alive = true;
    setLoadingUsers(true);
    fetchUserNames()
      .then((names) => {
        if (!alive) return;
        const opts = names.length >= 2 ? names : loadOptions(userId);
        setOptions(opts);
        setOptionsText(opts.join("\n"));
        saveOptions(userId, opts);
      })
      .finally(() => {
        if (alive) setLoadingUsers(false);
      });
    return () => {
      alive = false;
    };
  }, [userId]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const colors = useMemo(() => options.map((_, i) => colorFor(i)), [options]);
  const canSpin = !spinning && options.length >= 2;

  function applyOptions() {
    const parsed = optionsText
      .split(/\r?\n|,/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (parsed.length < 2) return;
    setOptions(parsed);
    saveOptions(userId, parsed);
    setResult(null);
  }

  function spin() {
    if (!canSpin) return;
    const n = options.length;
    const slice = 360 / n;
    const index = pickRandomIndex(n);
    // Segments are drawn so that index i is centered at angle `i * slice` (offset -slice/2).
    // Pointer is at the top (0 deg). To land segment i under the pointer, rotate by -i*slice.
    const segCenter = index * slice;
    const base = rotation - (rotation % 360);
    const target = base + SPIN_TURNS * 360 + ((360 - segCenter) % 360);
    setSpinning(true);
    setResult(null);
    setRotation(target);

    timerRef.current = setTimeout(() => {
      const label = options[index];
      setSpinning(false);
      setResult({ label, color: colors[index] });
      const entry = {
        id: `${Date.now()}`,
        ts: Date.now(),
        label,
        color: colors[index],
      };
      const next = pushHistory(userId, entry);
      setHistory(next);
    }, DURATION + 50);
  }

  const fmt = new Intl.DateTimeFormat(
    lang === "vi" ? "vi-VN" : lang === "ja" ? "ja-JP" : "en-US",
    { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" },
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <header className="mb-8 text-center">
        <p className="text-[10px] tracking-[0.4em] uppercase text-arena-red">
          {t("lw.tag")}
        </p>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl font-semibold">
          {t("lw.title")}
        </h1>
        <p className="mt-2 text-sm text-arena-muted max-w-xl mx-auto">{t("lw.tagline")}</p>
      </header>

      <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 items-start">
        {/* Options editor */}
        <section className="rounded-lg border border-arena-border bg-arena-surface p-5 order-2 lg:order-1">
          <h2 className="font-display text-lg mb-1">{t("lw.options_title")}</h2>
          <p className="text-xs text-arena-muted mb-3">{t("lw.options_hint")}</p>
          <textarea
            value={optionsText}
            onChange={(e) => setOptionsText(e.target.value)}
            rows={10}
            className="w-full rounded-md border border-arena-border bg-arena-card text-sm text-arena-text p-3 font-mono leading-relaxed focus:outline-none focus:border-arena-red"
            placeholder={t("lw.options_placeholder")}
          />
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-[11px] text-arena-muted">
              {loadingUsers
                ? t("common.loading")
                : t("lw.options_count", { n: options.length })}
            </span>
            <button
              onClick={applyOptions}
              className="px-4 py-1.5 rounded-md border border-arena-red/60 bg-arena-red/15 text-arena-red text-xs tracking-[0.2em] uppercase hover:bg-arena-red/25"
            >
              {t("lw.apply")}
            </button>
          </div>
        </section>

        {/* Wheel + button */}
        <section className="flex flex-col items-center gap-6 order-1 lg:order-2">
          <Wheel
            options={options}
            colors={colors}
            rotation={rotation}
            spinning={spinning}
            durationMs={DURATION}
          />
          <button
            onClick={spin}
            disabled={!canSpin}
            className={`px-10 py-3 rounded-md font-display text-sm tracking-[0.3em] uppercase border transition ${
              canSpin
                ? "bg-arena-red text-arena-bg border-arena-red hover:brightness-110"
                : "bg-arena-card text-arena-muted border-arena-border cursor-not-allowed"
            }`}
          >
            {spinning ? t("lw.spinning") : t("lw.spin")}
          </button>

          {result && !spinning && (
            <div
              className="w-full max-w-sm rounded-lg border border-arena-red/40 bg-arena-red/10 p-4 text-center"
              role="status"
            >
              <p className="text-[10px] tracking-[0.3em] uppercase text-arena-red">
                {t("lw.result")}
              </p>
              <p
                className="mt-1 font-display text-2xl"
                style={{ color: result.color }}
              >
                {result.label}
              </p>
            </div>
          )}
        </section>

        {/* History */}
        <aside className="rounded-lg border border-arena-border bg-arena-surface p-5 order-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg">{t("lw.history")}</h2>
            {history.length > 0 && (
              <button
                onClick={() => {
                  clearHistory(userId);
                  setHistory([]);
                }}
                className="text-[10px] tracking-[0.2em] uppercase text-arena-muted hover:text-arena-red"
              >
                {t("lw.clear")}
              </button>
            )}
          </div>
          {history.length === 0 ? (
            <p className="text-sm text-arena-muted">{t("lw.history_empty")}</p>
          ) : (
            <ul className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {history.map((h) => (
                <li
                  key={h.id}
                  className="flex items-center gap-3 rounded border border-arena-border bg-arena-card px-3 py-2"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: h.color }}
                  />
                  <span className="flex-1 text-sm text-arena-text truncate">
                    {h.label}
                  </span>
                  <span className="text-[11px] text-arena-muted shrink-0">
                    {fmt.format(new Date(h.ts))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
