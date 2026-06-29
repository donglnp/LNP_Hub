import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Ring from "../components/Ring";
import { useAuth } from "../../../lib/AuthContext";
import { useT, localeOf, formatNum } from "../../../lib/i18n";
import { fetchMyEntries, setMyGender, subscribeEntries } from "../lib/wellness";
import {
  PROGRAM,
  PRIZES,
  clampToProgram,
  currentMonthInfo,
  daysLeftInMonthWeek,
  daysUntil,
  findExercise,
  isLeftoverDay,
  monthlyKpi,
  programProgress,
  programState,
  sumKcalThisMonth,
  sumKcalThisMonthWeek,
  weeklyKpi,
  weeksMetKpi,
} from "../lib/data";

function prizeAmountKey(id) {
  return id === "streak" ? "wc.prize_amount_streak" : "wc.prize_amount_monthly";
}

export default function Dashboard() {
  const { user, profile, refreshProfile } = useAuth();
  const { t, lang } = useT();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const locale = localeOf(lang);

  useEffect(() => {
    if (!user?.id) return;
    let alive = true;
    async function load() {
      setLoading(true);
      const data = await fetchMyEntries(user.id);
      if (!alive) return;
      setEntries(data);
      setLoading(false);
    }
    load();
    const off = subscribeEntries(load);
    return () => {
      alive = false;
      off();
    };
  }, [user?.id]);

  const state = programState();
  const gender = profile?.gender;
  const monthInfo = currentMonthInfo();
  const monthLabel = t(`wc.month_${monthInfo.month}`);
  const weekKpi = gender ? weeklyKpi(gender, monthInfo.month) : 0;
  const monthKpi = gender ? monthlyKpi(gender, monthInfo.month) : 0;
  const weekKcal = sumKcalThisMonthWeek(entries);
  const monthKcal = sumKcalThisMonth(entries);
  const weeksHit = gender ? weeksMetKpi(entries, gender) : 0;
  const progressPct = programProgress();
  const isUpcoming = state === "upcoming";
  const daysToStart = isUpcoming ? daysUntil(PROGRAM.startDate) : 0;
  const recent = entries.slice(0, 3);
  // Month is the source of truth (prizes & KPI). Week is only a pacing nudge.
  const monthlyOk = monthKpi > 0 && monthKcal >= monthKpi;
  const monthRemain = Math.max(0, monthKpi - monthKcal);
  const onLeftoverDay = isLeftoverDay(clampToProgram(new Date()));
  const freshWeek = weekKcal === 0;
  const weekDaysLeft = daysLeftInMonthWeek();
  const monthlyPct =
    monthKpi > 0 ? Math.min(100, Math.round((monthKcal / monthKpi) * 100)) : 0;

  // ---- empty / setup states ----
  if (!profile?.joined_wellness) {
    return (
      <EmptyState
        icon="🌿"
        title={t("wc.empty_not_joined_title")}
        sub={t("wc.empty_not_joined_sub")}
      />
    );
  }
  if (!gender) {
    return (
      <EmptyState
        icon="⚙️"
        title={t("wc.empty_need_kpi_title")}
        sub={t("wc.empty_need_kpi_sub")}
        action={<GenderPicker onSaved={refreshProfile} />}
      />
    );
  }
  if (state === "ended") {
    return (
      <EmptyState
        icon="🏁"
        title={t("wc.empty_ended_title")}
        sub={t("wc.empty_ended_sub")}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="rounded-lg border border-arena-border bg-arena-surface p-5 sm:p-7">
        <div className="flex flex-col lg:flex-row gap-7 items-start lg:items-center">
          <Ring value={monthKcal} max={monthKpi} label={t("wc.ring_label_month")} />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] tracking-[0.4em] uppercase text-arena-amber">
              {t("wc.hero_tagline", { month: monthLabel })}
            </p>
            <h1 className="mt-2 font-display text-3xl sm:text-4xl font-semibold leading-tight">
              {monthlyOk ? (
                <>
                  {t("wc.hero_month_hit", { month: monthLabel })}{" "}
                  <span className="text-arena-amber">
                    {t("wc.hero_month_keep")}
                  </span>
                </>
              ) : (
                <>
                  {t("wc.hero_month_need_part1")}{" "}
                  <span className="text-arena-amber">
                    {formatNum(monthRemain, lang)} kcal
                  </span>{" "}
                  {t("wc.hero_month_need_part2", { month: monthLabel })}
                </>
              )}
            </h1>
            <p className="mt-2 text-sm text-arena-muted">
              {onLeftoverDay
                ? t("wc.hero_week_leftover")
                : monthlyOk
                ? t("wc.hero_week_keep")
                : freshWeek
                ? t("wc.hero_week_fresh", { kpi: formatNum(weekKpi, lang) })
                : t("wc.hero_week_pace", {
                    kpi: formatNum(weekKpi, lang),
                    days: weekDaysLeft,
                  })}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to="/wellness-challenge/log"
                className="inline-flex items-center gap-2 rounded-md bg-arena-amber text-arena-bg px-4 py-2 text-xs font-semibold tracking-[0.15em] uppercase hover:brightness-110"
              >
                {t("wc.btn_log")}
              </Link>
              <Link
                to="/wellness-challenge/history"
                className="inline-flex items-center gap-2 rounded-md border border-arena-border hover:border-arena-amber/60 px-4 py-2 text-xs font-semibold tracking-[0.15em] uppercase text-arena-muted hover:text-arena-text"
              >
                {t("wc.btn_history")}
              </Link>
              <Link
                to="/wellness-challenge/rules"
                className="inline-flex items-center gap-2 rounded-md border border-arena-border hover:border-arena-amber/60 px-4 py-2 text-xs font-semibold tracking-[0.15em] uppercase text-arena-muted hover:text-arena-text"
              >
                {t("wc.btn_rules")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t("wc.stat_this_month")}
          value={formatNum(monthKcal, lang)}
          unit="kcal"
          sub={t("wc.stat_month_sub", {
            pct: monthlyPct,
            kpi: formatNum(monthKpi, lang),
          })}
          tone={monthKcal >= monthKpi ? "green" : "amber"}
        />
        <StatCard
          label={t("wc.stat_weeks_hit")}
          value={`${weeksHit}`}
          unit={t("wc.stat_weeks_unit")}
          sub={t("wc.stat_weeks_sub")}
          tone="amber"
        />
        <StatCard
          label={t("wc.stat_progress")}
          value={isUpcoming ? `D-${daysToStart}` : `${progressPct}%`}
          unit=""
          sub={
            isUpcoming
              ? t("wc.stat_progress_upcoming", { days: daysToStart })
              : t("wc.stat_progress_sub")
          }
          tone={isUpcoming ? "amber" : "muted"}
        />
        <StatCard
          label={t("wc.stat_gender_kpi")}
          value={gender === "male" ? t("wc.gender_male") : t("wc.gender_female")}
          unit=""
          sub={t("wc.stat_per_week", { kpi: formatNum(weekKpi, lang) })}
          tone="muted"
        />
      </section>

      {/* 3-month track */}
      <section className="rounded-lg border border-arena-border bg-arena-surface p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">{t("wc.track_title")}</h2>
          <span className="text-[10px] tracking-[0.3em] uppercase text-arena-muted">
            {t("wc.track_subtitle")}
          </span>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          {PROGRAM.months.map((m) => {
            const isCurrent = m.month === monthInfo.month;
            const past = m.month < monthInfo.month;
            return (
              <div
                key={m.month}
                className={`rounded border p-4 ${
                  isCurrent
                    ? "border-arena-amber/60 bg-arena-amber/5"
                    : "border-arena-border bg-arena-card"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-display text-lg font-semibold">
                    {t(`wc.month_${m.month}`)}
                  </p>
                  <span
                    className={`text-[10px] tracking-[0.25em] uppercase ${
                      isCurrent
                        ? "text-arena-amber"
                        : past
                        ? "text-arena-green"
                        : "text-arena-muted"
                    }`}
                  >
                    {isCurrent
                      ? t("wc.track_current")
                      : past
                      ? t("wc.track_past")
                      : t("wc.track_upcoming")}
                  </span>
                </div>
                <p className="mt-2 font-mono text-sm text-arena-text">
                  {formatNum(weeklyKpi(gender, m.month), lang)} {t("wc.track_per_week")}
                </p>
                <p className="text-xs text-arena-muted">
                  {t("wc.track_month_total", {
                    kpi: formatNum(monthlyKpi(gender, m.month), lang),
                  })}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid lg:grid-cols-[1fr_1fr] gap-6">
        <section className="rounded-lg border border-arena-border bg-arena-surface">
          <div className="flex items-center justify-between px-5 py-4 border-b border-arena-border">
            <h2 className="text-sm font-semibold">{t("wc.recent_title")}</h2>
            <Link
              to="/wellness-challenge/history"
              className="text-[10px] tracking-[0.25em] uppercase text-arena-muted hover:text-arena-text"
            >
              {t("wc.recent_view_all")}
            </Link>
          </div>
          {loading ? (
            <p className="px-5 py-8 text-sm text-arena-muted text-center">
              {t("wc.loading")}
            </p>
          ) : recent.length === 0 ? (
            <p className="px-5 py-8 text-sm text-arena-muted text-center">
              {t("wc.recent_empty")}
            </p>
          ) : (
            <ul className="divide-y divide-arena-border/60">
              {recent.map((e) => {
                const ex = findExercise(e.exercise_type);
                const dateShort = new Date(e.entry_date).toLocaleDateString(
                  locale,
                  { day: "2-digit", month: "2-digit" }
                );
                return (
                  <li
                    key={e.id}
                    className="px-5 py-4 flex items-center gap-4"
                  >
                    <span className="text-2xl">{ex.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {t(`wc.ex_${ex.id}`)}
                      </p>
                      <p className="text-xs text-arena-muted">
                        {dateShort} · {e.duration_min} {t("wc.minutes_short")}
                      </p>
                    </div>
                    <p className="font-mono text-arena-amber font-semibold">
                      {formatNum(e.kcal, lang)}
                      <span className="text-arena-muted text-xs ml-1">kcal</span>
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-arena-border bg-arena-surface">
          <div className="px-5 py-4 border-b border-arena-border">
            <h2 className="text-sm font-semibold">{t("wc.prizes_title")}</h2>
          </div>
          <ul className="divide-y divide-arena-border/60">
            {PRIZES.map((p) => (
              <li key={p.id} className="px-5 py-4 flex items-start gap-4">
                <span className="text-2xl">{p.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{t(`wc.prize_${p.id}`)}</p>
                  <p className="text-xs text-arena-amber font-mono mt-1">
                    {t(prizeAmountKey(p.id))}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value, unit, sub, tone = "muted" }) {
  const toneClass =
    tone === "green"
      ? "text-arena-green"
      : tone === "amber"
      ? "text-arena-amber"
      : "text-arena-text";
  return (
    <div className="rounded-lg border border-arena-border bg-arena-surface p-4">
      <p className="text-[10px] tracking-[0.3em] uppercase text-arena-muted">
        {label}
      </p>
      <p className="mt-3 font-display text-2xl sm:text-3xl font-semibold">
        <span className={toneClass}>{value}</span>
        {unit && (
          <span className="text-arena-muted text-sm ml-1.5 font-normal">
            {unit}
          </span>
        )}
      </p>
      <p className="text-[11px] text-arena-muted mt-1">{sub}</p>
    </div>
  );
}

function GenderPicker({ onSaved }) {
  const { t } = useT();
  const [saving, setSaving] = useState(null);
  const [error, setError] = useState(false);

  async function pick(g) {
    if (saving) return;
    setError(false);
    setSaving(g);
    try {
      await setMyGender(g);
      await onSaved?.();
    } catch (e) {
      console.warn("[wellness] setMyGender", e);
      setError(true);
      setSaving(null);
    }
  }

  const opts = [
    { value: "male", label: t("wc.gender_male") },
    { value: "female", label: t("wc.gender_female") },
  ];

  return (
    <div>
      <div className="flex justify-center gap-3">
        {opts.map((o) => (
          <button
            key={o.value}
            type="button"
            disabled={Boolean(saving)}
            onClick={() => pick(o.value)}
            className="min-w-[7rem] rounded-md border border-arena-border bg-arena-bg px-5 py-3 text-sm font-semibold tracking-[0.15em] uppercase hover:border-arena-amber/60 hover:text-arena-amber disabled:opacity-50"
          >
            {saving === o.value ? "…" : o.label}
          </button>
        ))}
      </div>
      {error && (
        <p className="mt-3 text-xs text-arena-red">{t("wc.gender_set_error")}</p>
      )}
    </div>
  );
}

function EmptyState({ icon, title, sub, action }) {
  return (
    <div className="rounded-lg border border-arena-border bg-arena-surface p-10 sm:p-14 text-center">
      <div className="text-5xl">{icon}</div>
      <h1 className="mt-4 font-display text-2xl sm:text-3xl font-semibold">
        {title}
      </h1>
      <p className="mt-3 text-sm text-arena-muted max-w-md mx-auto">{sub}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
