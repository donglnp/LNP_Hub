import { useState, useEffect } from "react";
import { WEEKDAYS, weekdayLabel } from "../lib/dates";
import { useT } from "../../../lib/i18n";

export default function PatternEditor({ initial, onSave, saving }) {
  const { t, lang } = useT();
  const [selected, setSelected] = useState(new Set(initial || []));

  useEffect(() => {
    setSelected(new Set(initial || []));
  }, [initial]);

  function toggle(wd) {
    const next = new Set(selected);
    if (next.has(wd)) next.delete(wd);
    else next.add(wd);
    setSelected(next);
  }

  const dirty =
    selected.size !== (initial?.length || 0) ||
    [...selected].some((w) => !(initial || []).includes(w));

  return (
    <div className="rounded-lg border border-arena-border bg-arena-surface p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🔁</span>
        <div>
          <h2 className="font-display text-md font-semibold text-arena-text">
            {t("coworking.pattern_title")}
          </h2>
          <p className="text-[11px] text-arena-muted">
            {t("coworking.pattern_desc")}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {WEEKDAYS.map((wd) => {
          const active = selected.has(wd);
          return (
            <button
              key={wd}
              onClick={() => toggle(wd)}
              className={[
                "px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider border transition",
                active
                  ? "bg-arena-blue text-arena-bg border-arena-blue"
                  : "bg-arena-card text-arena-muted border-arena-border hover:border-arena-blue/60",
              ].join(" ")}
            >
              {weekdayLabel(wd, lang)}
            </button>
          );
        })}
      </div>
      <button
        onClick={() => onSave([...selected].sort())}
        disabled={!dirty || saving}
        className="w-full px-4 py-2 rounded-md font-semibold text-xs tracking-wide bg-arena-blue text-arena-bg hover:brightness-110 transition disabled:opacity-50"
      >
        {saving ? t("common.saving") : t("coworking.pattern_save")}
      </button>
    </div>
  );
}
