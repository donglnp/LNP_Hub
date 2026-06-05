import { useEffect, useMemo, useState } from "react";
import { useT } from "../../lib/i18n";
import { useWorldCup } from "../../games/wc/lib/useWorldCup";
import {
  loadResults,
  onResultsChange,
  getResult,
} from "../../games/wc/lib/results";
import {
  fetchAllPredictions,
  fetchAdminProfiles,
  adminSetMatchLock,
  adminUpdatePrediction,
  adminDeletePrediction,
  syncResultsFromApi,
} from "../../games/wc/lib/wcAdmin";

const TABS = [
  { id: "results", key: "wcAdmin.tab_results" },
  { id: "predictions", key: "wcAdmin.tab_predictions" },
];

// ── helpers ─────────────────────────────────────────────────
function teamOf(teams, code) {
  return teams?.[code] || { code, name: code || "—", flag: "🏳️" };
}

function fmtKickoff(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Group matches by group letter, knockout stages after, sorted by kickoff inside.
function groupMatches(matches) {
  const map = new Map();
  for (const m of matches) {
    const key = m.group && m.group !== "—" ? m.group : m.stage || "—";
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(m);
  }
  for (const list of map.values()) {
    list.sort((a, b) => String(a.kickoff || "").localeCompare(String(b.kickoff || "")));
  }
  return [...map.entries()].sort((a, b) => {
    const single = (s) => /^[A-Z]$/.test(s);
    if (single(a[0]) && single(b[0])) return a[0].localeCompare(b[0]);
    if (single(a[0])) return -1;
    if (single(b[0])) return 1;
    return a[0].localeCompare(b[0]);
  });
}

function groupLabel(key, t) {
  if (/^[A-Z]$/.test(key)) return t("wcAdmin.group", { g: key });
  if (key === "—") return t("wcAdmin.other");
  return key
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function MatchStatusBadge({ status, t }) {
  const map = {
    upcoming: { key: "wcAdmin.status_upcoming", cls: "text-arena-muted border-arena-border" },
    live: { key: "wcAdmin.status_live", cls: "text-arena-red border-arena-red/30 bg-arena-red/10" },
    finished: { key: "wcAdmin.status_finished", cls: "text-arena-green border-arena-green/30 bg-arena-green/10" },
  };
  const m = map[status] || map.upcoming;
  return (
    <span className={`text-[10px] tracking-[0.15em] uppercase px-2 py-1 rounded border ${m.cls}`}>
      {t(m.key)}
    </span>
  );
}

function TeamLabel({ team, align = "left", compact = false }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${align === "right" ? "flex-row-reverse" : ""}`}>
      <Flag flag={team.flag} compact={compact} />
      <span className={`font-medium whitespace-nowrap ${compact ? "text-sm" : ""}`}>{team.name}</span>
    </span>
  );
}

function Flag({ flag, compact = false }) {
  const imgCls = compact ? "w-6 h-6" : "w-8 h-8";
  const emojiCls = compact ? "text-2xl" : "text-3xl";
  if (typeof flag === "string" && flag.startsWith("http")) {
    return <img src={flag} alt="" className={`${imgCls} rounded-sm object-cover`} />;
  }
  return <span className={`${emojiCls} leading-none`}>{flag}</span>;
}

function Avatar({ profile }) {
  return (
    <span className="w-7 h-7 rounded-full border border-arena-border bg-arena-card grid place-items-center text-[10px] font-semibold overflow-hidden shrink-0">
      {profile?.avatar_url ? (
        <img
          src={profile.avatar_url}
          alt=""
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
      ) : (
        (profile?.full_name || "?")
          .split(" ")
          .map((s) => s[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()
      )}
    </span>
  );
}

// ── main ────────────────────────────────────────────────────
export default function WorldCupAdmin() {
  const { t } = useT();
  const { data, loading: wcLoading } = useWorldCup();
  const [tab, setTab] = useState("results");
  const [resultsVer, setResultsVer] = useState(0);
  const [predictions, setPredictions] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const teams = data?.teams || {};
  const matches = useMemo(() => data?.matches || [], [data]);

  async function reload() {
    setLoading(true);
    await loadResults();
    const [preds, profs] = await Promise.all([
      fetchAllPredictions(),
      fetchAdminProfiles(),
    ]);
    setPredictions(preds);
    setProfiles(profs);
    setResultsVer((v) => v + 1);
    setLoading(false);
  }

  useEffect(() => {
    reload();
    const off = onResultsChange(() => setResultsVer((v) => v + 1));
    return off;
  }, []);

  function showToast(text, type = "success") {
    setToast({ text, type });
    setTimeout(() => setToast(null), 2500);
  }

  const profileById = useMemo(
    () => Object.fromEntries(profiles.map((p) => [p.id, p])),
    [profiles]
  );

  return (
    <>
      <div className="mb-5 flex gap-1 border-b border-arena-border">
        {TABS.map((tb) => (
          <button
            key={tb.id}
            type="button"
            onClick={() => setTab(tb.id)}
            className={`px-3 py-2 text-xs tracking-[0.2em] uppercase border-b-2 -mb-px transition ${
              tab === tb.id
                ? "border-arena-blue text-arena-blue"
                : "border-transparent text-arena-muted hover:text-arena-text"
            }`}
          >
            {t(tb.key)}
          </button>
        ))}
      </div>

      {wcLoading || loading ? (
        <p className="py-12 text-sm text-arena-muted text-center">{t("wcAdmin.loading")}</p>
      ) : tab === "results" ? (
        <ResultsTab
          key={resultsVer}
          t={t}
          teams={teams}
          matches={matches}
          onSync={async () => {
            try {
              const n = await syncResultsFromApi(matches);
              showToast(n ? t("wcAdmin.toast_synced", { n }) : t("wcAdmin.toast_sync_none"));
            } catch (e) {
              showToast(e.message, "error");
            }
          }}
        />
      ) : (
        <PredictionsTab
          t={t}
          teams={teams}
          matches={matches}
          predictions={predictions}
          profileById={profileById}
          onChanged={reload}
          onToast={showToast}
        />
      )}

      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-4 py-3 rounded-md text-sm shadow-lg border ${
            toast.type === "error"
              ? "bg-arena-red/15 border-arena-red/40 text-arena-red"
              : "bg-arena-green/15 border-arena-green/40 text-arena-green"
          }`}
        >
          {toast.text}
        </div>
      )}
    </>
  );
}

// ── Results tab ─────────────────────────────────────────────
function ScoreBox({ value, has }) {
  return (
    <span
      className={`inline-flex items-center justify-center w-11 h-9 rounded-md border font-mono font-semibold ${
        has
          ? "border-arena-green/40 bg-arena-green/10 text-arena-green"
          : "border-arena-border bg-arena-card text-arena-muted"
      }`}
    >
      {value ?? "–"}
    </span>
  );
}

function ResultRow({ t, match: m, teams }) {
  const existing = getResult(m.id);
  const h = teamOf(teams, m.home);
  const a = teamOf(teams, m.away);

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-arena-card/30 transition">
      <span className="w-24 text-[11px] text-arena-muted shrink-0">{fmtKickoff(m.kickoff)}</span>

      <div className="flex-1 flex items-center justify-center gap-3">
        <div className="flex-1 flex justify-end">
          <TeamLabel team={h} align="right" />
        </div>
        <ScoreBox value={existing ? existing.home : null} has={!!existing} />
        <span className="text-arena-muted text-xs">–</span>
        <ScoreBox value={existing ? existing.away : null} has={!!existing} />
        <div className="flex-1 flex justify-start">
          <TeamLabel team={a} />
        </div>
      </div>

      <div className="w-24 flex justify-end shrink-0">
        <MatchStatusBadge status={m.status} t={t} />
      </div>
    </div>
  );
}

function ResultsTab({ t, teams, matches, onSync }) {
  const [search, setSearch] = useState("");
  const [onlyMissing, setOnlyMissing] = useState(false);

  const groups = useMemo(() => {
    let list = matches;
    if (onlyMissing) list = list.filter((m) => !getResult(m.id));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((m) => {
        const h = teamOf(teams, m.home);
        const a = teamOf(teams, m.away);
        return (
          h.name.toLowerCase().includes(q) ||
          a.name.toLowerCase().includes(q) ||
          String(m.group || "").toLowerCase().includes(q)
        );
      });
    }
    return groupMatches(list);
  }, [matches, teams, search, onlyMissing]);

  const recorded = matches.filter((m) => getResult(m.id)).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-display text-2xl font-semibold mr-auto">
          {t("wcAdmin.results_title")} ·{" "}
          <span className="text-arena-blue">{recorded}</span>
          <span className="text-arena-muted">/{matches.length}</span>
        </h2>
        <label className="flex items-center gap-2 text-xs text-arena-muted cursor-pointer">
          <input
            type="checkbox"
            checked={onlyMissing}
            onChange={(e) => setOnlyMissing(e.target.checked)}
          />
          {t("wcAdmin.only_missing")}
        </label>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("wcAdmin.search_match")}
          className="input max-w-xs"
        />
        <button
          onClick={onSync}
          className="rounded-md bg-arena-blue text-arena-bg px-4 py-2 text-xs font-semibold tracking-wide uppercase hover:brightness-110"
          title={t("wcAdmin.sync_hint")}
        >
          {t("wcAdmin.sync_api")}
        </button>
      </div>

      <p className="text-xs text-arena-muted">{t("wcAdmin.results_api_note")}</p>

      {groups.length === 0 ? (
        <div className="rounded-xl border border-arena-border bg-arena-surface">
          <p className="py-12 text-sm text-arena-muted text-center">{t("wcAdmin.no_matches")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map(([key, ms]) => {
            const done = ms.filter((m) => getResult(m.id)).length;
            return (
              <section
                key={key}
                className="rounded-xl border border-arena-border bg-arena-surface overflow-hidden"
              >
                <header className="flex items-center gap-3 px-4 py-2.5 bg-arena-card/40 border-b border-arena-border">
                  <span className="text-xs font-semibold tracking-[0.2em] uppercase text-arena-blue">
                    {groupLabel(key, t)}
                  </span>
                  <span className="ml-auto text-[11px] font-mono text-arena-muted">
                    {done}/{ms.length}
                  </span>
                </header>
                <div className="divide-y divide-arena-border/60">
                  {ms.map((m) => (
                    <ResultRow key={m.id} t={t} match={m} teams={teams} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Predictions tab ─────────────────────────────────────────
function PredictionsTab({ t, teams, matches, predictions, profileById, onChanged, onToast }) {
  const [search, setSearch] = useState("");
  const matchById = useMemo(
    () => Object.fromEntries(matches.map((m) => [m.id, m])),
    [matches]
  );

  // Group predictions by match, filtered by user search, sorted by kickoff.
  const groups = useMemo(() => {
    let preds = predictions;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      preds = preds.filter((p) => {
        const u = profileById[p.user_id];
        return (
          u?.full_name?.toLowerCase().includes(q) ||
          u?.email?.toLowerCase().includes(q)
        );
      });
    }
    const map = new Map();
    for (const p of preds) {
      if (!map.has(p.match_id)) map.set(p.match_id, []);
      map.get(p.match_id).push(p);
    }
    return [...map.entries()]
      .map(([mid, list]) => ({
        mid,
        match: matchById[mid],
        preds: list.sort((a, b) =>
          (profileById[a.user_id]?.full_name || "").localeCompare(
            profileById[b.user_id]?.full_name || ""
          )
        ),
      }))
      .sort((a, b) =>
        String(a.match?.kickoff || "~").localeCompare(String(b.match?.kickoff || "~"))
      );
  }, [predictions, search, profileById, matchById]);

  async function lockMatch(mid, locked) {
    if (!confirm(locked ? t("wcAdmin.confirm_lock_all") : t("wcAdmin.confirm_unlock_all"))) return;
    try {
      await adminSetMatchLock(mid, locked);
      await onChanged();
      onToast(locked ? t("wcAdmin.toast_locked") : t("wcAdmin.toast_unlocked"));
    } catch (e) {
      onToast(e.message, "error");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-display text-2xl font-semibold mr-auto">
          {t("wcAdmin.predictions_title")} ·{" "}
          <span className="text-arena-blue">{predictions.length}</span>
        </h2>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("wcAdmin.search_user")}
          className="input max-w-xs"
        />
      </div>

      {groups.length === 0 ? (
        <div className="rounded-xl border border-arena-border bg-arena-surface">
          <p className="py-12 text-sm text-arena-muted text-center">{t("wcAdmin.no_predictions")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map(({ mid, match, preds }) => (
            <MatchPredictions
              key={mid}
              t={t}
              mid={mid}
              match={match}
              teams={teams}
              preds={preds}
              profileById={profileById}
              onLock={lockMatch}
              onChanged={onChanged}
              onToast={onToast}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MatchPredictions({ t, mid, match, teams, preds, profileById, onLock, onChanged, onToast }) {
  const result = getResult(mid);
  const h = match ? teamOf(teams, match.home) : null;
  const a = match ? teamOf(teams, match.away) : null;

  return (
    <section className="rounded-xl border border-arena-border bg-arena-surface overflow-hidden">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 bg-arena-card/40 border-b border-arena-border">
        {match ? (
          <div className="flex items-center gap-2">
            <TeamLabel team={h} align="right" compact />
            <span className="text-arena-muted text-xs">{t("wcAdmin.vs")}</span>
            <TeamLabel team={a} compact />
          </div>
        ) : (
          <span className="font-medium">{mid}</span>
        )}

        {result && (
          <span className="text-[11px] font-mono px-2 py-1 rounded border text-arena-green border-arena-green/30 bg-arena-green/10">
            {t("wcAdmin.result_chip", { h: result.home, a: result.away })}
          </span>
        )}
        {match && (
          <span className="text-[11px] text-arena-muted">{fmtKickoff(match.kickoff)}</span>
        )}

        <span className="ml-auto text-[11px] text-arena-muted">
          {t("wcAdmin.pred_count", { n: preds.length })}
        </span>
        <span className="inline-flex rounded border border-arena-border overflow-hidden text-[11px]">
          <button
            type="button"
            onClick={() => onLock(mid, true)}
            className="px-2.5 py-1.5 text-arena-muted hover:text-arena-text"
          >
            {t("wcAdmin.lock_all")}
          </button>
          <button
            type="button"
            onClick={() => onLock(mid, false)}
            className="px-2.5 py-1.5 text-arena-muted hover:text-arena-text border-l border-arena-border"
          >
            {t("wcAdmin.unlock_all")}
          </button>
        </span>
      </header>

      <div className="divide-y divide-arena-border/60">
        {preds.map((p) => (
          <PredictionRow
            key={`${p.user_id}:${p.match_id}`}
            t={t}
            pred={p}
            profile={profileById[p.user_id]}
            onChanged={onChanged}
            onToast={onToast}
          />
        ))}
      </div>
    </section>
  );
}

function PredictionRow({ t, pred: p, profile, onChanged, onToast }) {
  const [editing, setEditing] = useState(false);
  const [home, setHome] = useState(String(p.home_score));
  const [away, setAway] = useState(String(p.away_score));
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await adminUpdatePrediction(p.user_id, p.match_id, home, away);
      setEditing(false);
      await onChanged();
      onToast(t("wcAdmin.toast_prediction_saved"));
    } catch (e) {
      onToast(e.message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm(t("wcAdmin.confirm_delete_prediction"))) return;
    setBusy(true);
    try {
      await adminDeletePrediction(p.user_id, p.match_id);
      await onChanged();
      onToast(t("wcAdmin.toast_prediction_deleted"));
    } catch (e) {
      onToast(e.message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-arena-card/30 transition">
      <Avatar profile={profile} />
      <div className="min-w-0">
        <p className="font-medium truncate">{profile?.full_name || "—"}</p>
        <p className="text-[11px] text-arena-muted truncate">{profile?.email}</p>
      </div>

      <div className="ml-auto flex items-center gap-3">
        {editing ? (
          <span className="inline-flex items-center gap-1">
            <input
              type="number"
              min="0"
              value={home}
              onChange={(e) => setHome(e.target.value)}
              className="input !w-12 !px-2 text-center"
            />
            <span className="text-arena-muted">–</span>
            <input
              type="number"
              min="0"
              value={away}
              onChange={(e) => setAway(e.target.value)}
              className="input !w-12 !px-2 text-center"
            />
          </span>
        ) : (
          <span className="font-mono font-semibold tabular-nums">
            {p.home_score} – {p.away_score}
          </span>
        )}

        <span className="w-5 text-center" title={p.locked ? t("wcAdmin.locked_yes") : t("wcAdmin.locked_no")}>
          {p.locked ? "🔒" : <span className="text-arena-muted">🔓</span>}
        </span>

        <span className="w-24 text-right whitespace-nowrap">
          {editing ? (
            <>
              <button
                onClick={save}
                disabled={busy}
                className="text-xs text-arena-blue hover:underline mr-3 disabled:opacity-40"
              >
                {t("wcAdmin.save")}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="text-xs text-arena-muted hover:underline"
              >
                {t("wcAdmin.cancel")}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                className="text-xs text-arena-blue hover:underline mr-3"
              >
                {t("wcAdmin.edit")}
              </button>
              <button
                onClick={remove}
                disabled={busy}
                className="text-xs text-arena-red hover:underline disabled:opacity-40"
              >
                {t("wcAdmin.delete")}
              </button>
            </>
          )}
        </span>
      </div>
    </div>
  );
}
