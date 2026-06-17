import { useEffect, useRef, useState } from "react";
import { loadScorers, loadScorerPhoto } from "../lib/scorers";
import { useT } from "../../../lib/i18n";
import { LeaderboardSkeleton } from "../../../components/Skeleton";

// Auto-refresh cadence — football-data.org aggregates scorer stats with a delay,
// so polling more often than this buys nothing.
const REFRESH_MS = 2 * 60 * 1000;

export default function Scorers() {
  const { t } = useT();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [meta, setMeta] = useState({ source: null, matchday: null });
  const loadRef = useRef(null);

  useEffect(() => {
    let alive = true;
    async function load(isManual) {
      if (isManual) setRefreshing(true);
      const { scorers, source, matchday } = await loadScorers();
      if (!alive) return;
      setRows(scorers);
      setMeta({ source, matchday });
      setLoading(false);
      setRefreshing(false);
      // Fill in headshots progressively — best-effort, cached, never blocks the table.
      scorers.forEach(async (s) => {
        const photo = await loadScorerPhoto(s.name);
        if (!alive || !photo) return;
        setRows((prev) =>
          prev.map((r) =>
            r.name === s.name && r.teamCode === s.teamCode ? { ...r, photo } : r
          )
        );
      });
    }
    loadRef.current = load;
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  if (loading) return <LeaderboardSkeleton />;

  return (
    <div>
      <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold">{t("sc.title")}</h1>
          <p className="text-sm text-arena-muted mt-1">{t("sc.subtitle")}</p>
          {meta.source && (
            <p className="text-xs text-arena-muted/80 mt-2">
              {meta.source === "mock"
                ? t("sc.source_mock")
                : t("sc.source", {
                    source: meta.source,
                    md: meta.matchday ?? "—",
                  })}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => loadRef.current?.(true)}
          disabled={refreshing}
          className="shrink-0 inline-flex items-center gap-2 rounded-md border border-arena-border bg-arena-surface px-3 py-2 text-xs text-arena-muted hover:text-arena-text hover:border-arena-green/60 transition disabled:opacity-50"
        >
          <span className={refreshing ? "animate-spin" : ""}>↻</span>
          {refreshing ? t("sc.refreshing") : t("sc.refresh")}
        </button>
      </div>

      <div className="rounded-lg border border-arena-border bg-arena-surface overflow-x-auto">
        <table className="w-full text-sm min-w-[420px]">
          <thead>
            <tr className="text-[10px] tracking-[0.25em] uppercase text-arena-muted border-b border-arena-border">
              <Th>{t("sc.col_rank")}</Th>
              <Th>{t("sc.col_player")}</Th>
              <Th>{t("sc.col_team")}</Th>
              <Th align="right">{t("sc.col_goals")}</Th>
              <Th align="right">{t("sc.col_assists")}</Th>
              <Th align="right">{t("sc.col_played")}</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-arena-muted">
                  {t("sc.empty")}
                </td>
              </tr>
            )}
            {rows.map((row, i) => {
              const rank = i + 1;
              return (
                <tr
                  key={`${row.name}-${row.teamCode}`}
                  className="border-b border-arena-border/60 last:border-0 hover:bg-arena-card/60"
                >
                  <Td>
                    {rank <= 3 ? (
                      <span>{rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉"}</span>
                    ) : (
                      <span className="text-arena-muted">{rank}</span>
                    )}
                  </Td>
                  <Td className="font-medium">
                    <span className="inline-flex items-center gap-2.5">
                      <PlayerAvatar photo={row.photo} name={row.name} />
                      {row.name}
                    </span>
                  </Td>
                  <Td>
                    <span className="inline-flex items-center gap-2">
                      <TeamFlag flag={row.teamFlag} name={row.teamName} />
                      <span className="text-arena-muted">{row.teamName}</span>
                    </span>
                  </Td>
                  <Td align="right" mono className="font-semibold">
                    {row.goals}
                    {row.penalties > 0 && (
                      <span className="text-arena-muted font-normal text-xs ml-1">
                        ({t("sc.pen", { n: row.penalties })})
                      </span>
                    )}
                  </Td>
                  <Td align="right" mono>
                    {row.assists}
                  </Td>
                  <Td align="right" mono className="text-arena-muted">
                    {row.played}
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PlayerAvatar({ photo, name }) {
  const initials = (name || "?")
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span className="w-7 h-7 shrink-0 rounded-full bg-arena-card border border-arena-border grid place-items-center overflow-hidden text-[10px] font-semibold text-arena-muted">
      {photo ? (
        <img
          src={photo}
          alt={name || ""}
          className="w-full h-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      ) : (
        initials
      )}
    </span>
  );
}

function TeamFlag({ flag, name }) {
  const isUrl = typeof flag === "string" && /^https?:\/\//.test(flag);
  return isUrl ? (
    <img
      src={flag}
      alt={name || ""}
      className="w-5 h-5 object-contain"
      loading="lazy"
    />
  ) : (
    <span className="text-base leading-none">{flag || "🏳️"}</span>
  );
}

function Th({ children, align = "left" }) {
  return (
    <th
      className={`px-3 sm:px-5 py-3 font-medium ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function Td({ children, align = "left", mono, className = "" }) {
  return (
    <td
      className={`px-3 sm:px-5 py-3 ${align === "right" ? "text-right" : "text-left"} ${
        mono ? "font-mono" : ""
      } ${className}`}
    >
      {children}
    </td>
  );
}
