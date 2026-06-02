import { useEffect, useMemo, useState } from "react";
import FlagBadge from "../components/FlagBadge";
import { useWorldCup } from "../lib/useWorldCup";
import {
  getPrediction,
  isMatchClosed,
  loadMyPredictions,
  onPredictionsChange,
  savePrediction,
  statusOf,
} from "../lib/predictions";
import { getResult, loadResults, onResultsChange } from "../lib/results";
import { useT } from "../../../lib/i18n";
import Bracket from "../components/Bracket";
import TeamSheet from "../components/TeamSheet";
import { MatchesSkeleton } from "../../../components/Skeleton";

export default function Matches({ user }) {
  const { t } = useT();
  const { data, loading } = useWorldCup();
  const [tab, setTab] = useState("All");
  const [view, setView] = useState("list"); // "list" | "bracket"
  const [openTeam, setOpenTeam] = useState(null);
  const [, force] = useState(0);

  useEffect(() => {
    if (user?.id) loadMyPredictions(user.id).then(() => force((n) => n + 1));
    loadResults().then(() => force((n) => n + 1));
    const offP = onPredictionsChange(() => force((n) => n + 1));
    const offR = onResultsChange(() => force((n) => n + 1));
    return () => {
      offP();
      offR();
    };
  }, [user?.id]);

  const { teams = {}, matches = [], source = {} } = data || {};

  const groups = useMemo(() => {
    if (!data) return [];
    return uniqueGroups(matches);
  }, [data, matches]);

  const tabs = useMemo(() => ["All", ...groups, "Knockouts"], [groups]);

  const filtered = useMemo(() => {
    if (!data) return [];
    return matches.filter((m) => {
      if (tab === "All") return true;
      if (tab === "Knockouts")
        return !m.group || m.group === "—" || /R\d|FINAL|SEMI|QUARTER/i.test(m.group);
      return m.group === tab;
    });
  }, [data, matches, tab]);

  const groupedByTime = useMemo(() => {
    if (!data) return [];
    const map = new Map();
    [...filtered]
      .sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff))
      .forEach((m) => {
        const d = new Date(m.kickoff);
        const k = d.toLocaleDateString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        if (!map.has(k)) map.set(k, []);
        map.get(k).push(m);
      });
    return [...map.entries()];
  }, [filtered, data]);

  if (loading || !data) return <MatchesSkeleton />;

  return (
    <div className="panel-green rounded-lg border border-arena-green/40 p-4 sm:p-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="font-display text-2xl font-semibold">{t("matches.title")}</h1>
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-md border border-arena-border overflow-hidden">
            <button
              onClick={() => setView("list")}
              className={`text-xs tracking-wide uppercase px-3 py-1.5 transition ${
                view === "list"
                  ? "bg-arena-green/15 text-arena-green"
                  : "text-arena-muted hover:text-arena-text"
              }`}
            >
              {t("matches.view_list")}
            </button>
            <button
              onClick={() => setView("bracket")}
              className={`text-xs tracking-wide uppercase px-3 py-1.5 transition border-l border-arena-border ${
                view === "bracket"
                  ? "bg-arena-green/15 text-arena-green"
                  : "text-arena-muted hover:text-arena-text"
              }`}
            >
              {t("matches.view_bracket")}
            </button>
          </div>
          <span className="hidden sm:inline text-[10px] tracking-[0.25em] uppercase text-arena-muted">
            {t("common.source")}: {source.matches}
          </span>
        </div>
      </div>

      {view === "bracket" ? (
        <div className="mt-6">
          <Bracket
            matches={matches}
            teams={teams}
            onTeamClick={setOpenTeam}
          />
        </div>
      ) : (
        <>
      <div className="mt-5 flex flex-wrap gap-2">
        {tabs.map((tabId) => (
          <button
            key={tabId}
            onClick={() => setTab(tabId)}
            className={`text-xs tracking-wide uppercase px-3 py-1.5 rounded-md border transition ${
              tab === tabId
                ? "border-arena-green bg-arena-green/15 text-arena-green"
                : "border-arena-border text-arena-muted hover:text-arena-text"
            }`}
          >
            {tabId === "All"
              ? t("matches.all")
              : tabId === "Knockouts"
              ? t("matches.knockouts")
              : `${t("dash.group")} ${tabId}`}
          </button>
        ))}
      </div>

      <div className="mt-8 space-y-8">
        {groupedByTime.length === 0 && (
          <p className="text-sm text-arena-muted">{t("matches.none")}</p>
        )}
        {groupedByTime.map(([label, items]) => (
          <div key={label}>
            <p className="text-[10px] tracking-[0.3em] uppercase text-arena-muted mb-3">
              {label}
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((m) => (
                <MatchCard
                  key={m.id}
                  match={m}
                  teams={teams}
                  user={user}
                  onTeamClick={setOpenTeam}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
        </>
      )}

      {openTeam && (
        <TeamSheet team={openTeam} onClose={() => setOpenTeam(null)} />
      )}
    </div>
  );
}

function uniqueGroups(matches) {
  const s = new Set();
  matches.forEach((m) => {
    if (m.group && m.group !== "—" && /^[A-Z]$/.test(m.group)) s.add(m.group);
  });
  return [...s].sort();
}

function MatchCard({ match, teams, user, onTeamClick }) {
  const { t } = useT();
  const home = teams[match.home] || { code: match.home, flag: "🏳️" };
  const away = teams[match.away] || { code: match.away, flag: "🏳️" };
  const initial = getPrediction(match.id);
  const [h, setH] = useState(initial.home);
  const [a, setA] = useState(initial.away);
  const [locked, setLocked] = useState(!!initial.locked);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setH(initial.home);
    setA(initial.away);
    setLocked(!!initial.locked);
  }, [match.id]); // eslint-disable-line

  const result = getResult(match.id);
  const closed = isMatchClosed(match, result);
  const finalScore = result || match.score || null;

  const s = statusOf({ home: h, away: a, locked }, match, result);
  const ringClass =
    s === "final"
      ? "border-arena-border opacity-90"
      : s === "locked"
      ? "border-arena-green shadow-glow"
      : s === "editing"
      ? "border-arena-amber"
      : "border-arena-border";

  async function commit() {
    if (!user?.id || saving || closed) return;
    setSaving(true);
    try {
      const nextLocked = !locked;
      await savePrediction(user.id, match.id, {
        home: h ?? 0,
        away: a ?? 0,
        locked: nextLocked,
      });
      setLocked(nextLocked);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`rounded-lg border ${ringClass} bg-arena-surface p-4 flex flex-col h-full`}>
      <div className="flex justify-between items-center text-[10px] tracking-[0.2em] uppercase mb-3">
        <span className="text-arena-muted">
          {t("dash.group")} {match.group}
          <span className="ml-2 font-mono">
            ·{" "}
            {new Date(match.kickoff).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </span>
        <StatusBadge status={s} />
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Side team={home} onClick={onTeamClick ? () => onTeamClick(home) : null} />
          </div>
          <div className="flex items-center gap-1">
            <Box value={h} onChange={setH} locked={locked || closed} tone={tone(s)} />
            <Box value={a} onChange={setA} locked={locked || closed} tone={tone(s)} />
          </div>
          <div className="flex-1 flex justify-end">
            <Side team={away} reverse onClick={onTeamClick ? () => onTeamClick(away) : null} />
          </div>
        </div>

        {finalScore && (
          <div className="mt-2 text-center text-[10px] tracking-[0.2em] uppercase text-arena-muted font-mono">
            {t("matches.full_time")} {finalScore.home}–{finalScore.away}
          </div>
        )}
      </div>

      <button
        onClick={commit}
        disabled={saving || closed}
        className={`mt-4 w-full text-xs tracking-[0.2em] uppercase py-2 rounded-md border transition disabled:opacity-50 ${
          s === "final"
            ? "border-arena-border text-arena-muted"
            : s === "locked"
            ? "border-arena-border text-arena-muted hover:text-arena-text"
            : s === "editing"
            ? "border-arena-amber text-arena-amber hover:bg-arena-amber/10"
            : "border-arena-green text-arena-green hover:bg-arena-green/10"
        }`}
      >
        {saving
          ? t("common.saving")
          : s === "final"
          ? t("matches.closed")
          : s === "locked"
          ? t("matches.edit")
          : s === "editing"
          ? t("matches.save")
          : t("matches.lock_in")}
      </button>
    </div>
  );
}

function tone(s) {
  if (s === "locked") return "text-arena-green border-arena-green/40";
  if (s === "editing") return "text-arena-amber border-arena-amber/40";
  return "text-arena-muted border-arena-border";
}

function Side({ team, reverse, onClick }) {
  return (
    <div className={`flex items-center gap-2 ${reverse ? "flex-row-reverse" : ""}`}>
      <FlagBadge team={team} size="sm" onClick={onClick} />
      <button
        type="button"
        onClick={onClick}
        disabled={!onClick}
        className={`font-display font-semibold text-sm ${
          onClick ? "hover:text-arena-green transition" : ""
        }`}
      >
        {team.code}
      </button>
    </div>
  );
}

function Box({ value, onChange, locked, tone }) {
  return (
    <input
      type="number"
      min={0}
      max={99}
      disabled={locked}
      value={value ?? ""}
      onChange={(e) => {
        if (e.target.value.length > 2) return;
        onChange(e.target.value === "" ? null : parseInt(e.target.value, 10));
      }}
      className={`w-9 h-9 text-center font-mono text-base rounded border bg-arena-card ${tone} outline-none disabled:opacity-100 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none focus:[&::-webkit-inner-spin-button]:appearance-auto focus:[&::-webkit-outer-spin-button]:appearance-auto`}
      placeholder="–"
    />
  );
}

function StatusBadge({ status }) {
  const { t } = useT();
  if (status === "final")
    return (
      <span className="text-arena-text inline-flex items-center gap-1 whitespace-nowrap shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-arena-text" /> {t("status.final")}
      </span>
    );
  if (status === "locked")
    return (
      <span className="text-arena-green inline-flex items-center gap-1 whitespace-nowrap shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-arena-green" /> {t("status.locked")}
      </span>
    );
  if (status === "editing")
    return (
      <span className="text-arena-amber inline-flex items-center gap-1 whitespace-nowrap shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-arena-amber" /> {t("status.editing")}
      </span>
    );
  return (
    <span className="text-arena-muted inline-flex items-center gap-1 whitespace-nowrap shrink-0">
      <span className="w-1.5 h-1.5 rounded-full bg-arena-muted" /> {t("status.pending")}
    </span>
  );
}


