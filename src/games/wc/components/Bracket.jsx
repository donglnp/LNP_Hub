import { Fragment } from "react";
import FlagBadge from "./FlagBadge";
import { useT } from "../../../lib/i18n";

// Maps various stage labels (football-data, TheSportsDB) to canonical rounds.
const STAGE_MAP = {
  ROUND_OF_32: "r32",
  LAST_32: "r32",
  ROUND_OF_16: "r16",
  LAST_16: "r16",
  QUARTER_FINALS: "qf",
  SEMI_FINALS: "sf",
  THIRD_PLACE_FINAL: "tp",
  THIRD_PLACE: "tp",
  FINAL: "f",
};

const ROUND_ORDER = ["r32", "r16", "qf", "sf", "f"];

// Code of the winning team of a played match, or null if drawn / not played.
function winnerCode(m) {
  const h = m.score?.home;
  const a = m.score?.away;
  if (h == null || a == null) return null;
  if (h > a) return m.home;
  if (a > h) return m.away;
  return null;
}

export default function Bracket({ matches, teams, onTeamClick }) {
  const { t } = useT();

  const ko = matches
    .map((m) => ({ ...m, round: STAGE_MAP[m.stage] }))
    .filter((m) => m.round && ROUND_ORDER.includes(m.round));

  const thirdPlace = matches
    .map((m) => ({ ...m, round: STAGE_MAP[m.stage] }))
    .filter((m) => m.round === "tp");

  const byRound = Object.fromEntries(ROUND_ORDER.map((r) => [r, []]));
  ko.forEach((m) => byRound[m.round].push(m));
  ROUND_ORDER.forEach((r) => {
    byRound[r].sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));
  });

  const hasAny = ROUND_ORDER.some((r) => byRound[r].length > 0);

  // Re-order each round (working back from the latest) so the two matches
  // whose winners feed a given next-round match sit adjacent, in the same
  // top/bottom order as that match's teams. This makes the elbow connectors
  // trace real advancement instead of mere card adjacency. Matches whose
  // winner isn't decided yet keep their kickoff order at the tail.
  const activeRounds = ROUND_ORDER.filter((r) => byRound[r].length > 0);
  for (let i = activeRounds.length - 2; i >= 0; i--) {
    const prev = byRound[activeRounds[i]];
    const next = byRound[activeRounds[i + 1]];
    // Each next match owns two fixed slots (2k, 2k+1). Place a decided feeder
    // into its slot so it lines up with the elbow that feeds that exact card;
    // leave the slot empty when the feeder isn't decided yet (e.g. the next
    // card is still TBD) so nothing shifts up into the wrong pair.
    const ordered = new Array(next.length * 2).fill(null);
    const used = new Set();
    next.forEach((n, k) => {
      [n.home, n.away].forEach((code, side) => {
        const feeder = prev.find(
          (p) => !used.has(p.id) && winnerCode(p) === code
        );
        if (feeder) {
          ordered[k * 2 + side] = feeder;
          used.add(feeder.id);
        }
      });
    });
    // Fill the gaps with the remaining matches, in kickoff order.
    const leftovers = prev.filter((p) => !used.has(p.id));
    let li = 0;
    for (let s = 0; s < ordered.length && li < leftovers.length; s++) {
      if (ordered[s] == null) ordered[s] = leftovers[li++];
    }
    while (li < leftovers.length) ordered.push(leftovers[li++]);
    byRound[activeRounds[i]] = ordered.filter(Boolean);
  }

  if (!hasAny) {
    return (
      <div className="rounded-lg border border-dashed border-arena-border p-12 text-center">
        <p className="text-arena-muted">{t("bracket.empty")}</p>
      </div>
    );
  }

  const labels = {
    r32: t("bracket.r32"),
    r16: t("bracket.r16"),
    qf: t("bracket.qf"),
    sf: t("bracket.sf"),
    f: t("bracket.f"),
  };

  return (
    <div className="space-y-8">
      <div className="overflow-x-auto pb-3">
        <div className="inline-flex items-stretch min-w-full">
          {activeRounds.map((round, i) => (
            <Fragment key={round}>
              <Column
                label={labels[round]}
                matches={byRound[round]}
                teams={teams}
                onTeamClick={onTeamClick}
              />
              {i < activeRounds.length - 1 && (
                <Connector count={byRound[round].length} />
              )}
            </Fragment>
          ))}
        </div>
      </div>

      {thirdPlace.length > 0 && (
        <div>
          <p className="text-[10px] tracking-[0.3em] uppercase text-arena-muted mb-3">
            {t("bracket.tp")}
          </p>
          <div className="max-w-sm">
            {thirdPlace.map((m) => (
              <MatchCell
                key={m.id}
                match={m}
                teams={teams}
                onTeamClick={onTeamClick}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Column({ label, matches, teams, onTeamClick }) {
  return (
    <div className="flex flex-col gap-4 min-w-[240px]">
      <p className="text-[10px] tracking-[0.3em] uppercase text-arena-muted">
        {label}
      </p>
      <div className="flex flex-col gap-3 justify-around flex-1">
        {matches.map((m) => (
          <MatchCell
            key={m.id}
            match={m}
            teams={teams}
            onTeamClick={onTeamClick}
          />
        ))}
      </div>
    </div>
  );
}

// Elbow connectors between two adjacent rounds. Each slot spans the vertical
// band of a pair of source matches; justify-around keeps slot centers aligned
// with the source cells' centers, and each elbow's exit meets the next round's
// cell center. SVG uses preserveAspectRatio=none so it stretches to any height,
// with vector-effect keeping the stroke a constant width.
function Connector({ count }) {
  const slots = Math.ceil(count / 2);
  return (
    <div
      className="flex flex-col gap-4 w-8 shrink-0 self-stretch text-arena-border"
      aria-hidden="true"
    >
      <p className="text-[10px] tracking-[0.3em] uppercase invisible">·</p>
      <div className="flex flex-col justify-around flex-1">
        {Array.from({ length: slots }).map((_, i) => {
          const paired = i * 2 + 1 < count;
          return (
            <div key={i} className="flex-1 min-h-[64px]">
              <svg
                viewBox="0 0 32 100"
                preserveAspectRatio="none"
                className="w-full h-full"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              >
                <path
                  d={
                    paired
                      ? "M0 25 H16 V75 H0 M16 50 H32"
                      : "M0 25 H16 V50 H32"
                  }
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MatchCell({ match, teams, onTeamClick }) {
  const { t } = useT();
  const home = teams[match.home];
  const away = teams[match.away];
  const homeScore = match.score?.home;
  const awayScore = match.score?.away;
  const winner =
    homeScore != null && awayScore != null
      ? homeScore > awayScore
        ? "home"
        : awayScore > homeScore
        ? "away"
        : null
      : null;

  return (
    <div className="rounded-lg border border-arena-border bg-arena-surface overflow-hidden">
      <TeamRow
        team={home}
        code={match.home}
        score={homeScore}
        winner={winner === "home"}
        onClick={home && onTeamClick ? () => onTeamClick(home) : null}
        tbdLabel={t("bracket.tbd")}
      />
      <div className="h-px bg-arena-border" />
      <TeamRow
        team={away}
        code={match.away}
        score={awayScore}
        winner={winner === "away"}
        onClick={away && onTeamClick ? () => onTeamClick(away) : null}
        tbdLabel={t("bracket.tbd")}
      />
      <div className="px-3 py-1.5 bg-arena-card/40 text-[10px] font-mono text-arena-muted">
        {new Date(match.kickoff).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        })}{" "}
        ·{" "}
        {new Date(match.kickoff).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </div>
    </div>
  );
}

function TeamRow({ team, code, score, winner, onClick, tbdLabel }) {
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick || undefined}
      className={`w-full flex items-center gap-2 px-3 py-2 text-left transition ${
        onClick ? "hover:bg-arena-card/60 cursor-pointer" : ""
      } ${winner ? "text-arena-green" : ""}`}
    >
      {team ? (
        <>
          <FlagBadge team={team} size="sm" />
          <span className="text-sm font-medium">{team.code}</span>
          <span className="text-xs text-arena-muted truncate">{team.name}</span>
        </>
      ) : (
        <>
          <span className="w-6 h-6 grid place-items-center rounded-full bg-arena-card border border-arena-border text-arena-muted text-xs">
            ?
          </span>
          <span className="text-xs text-arena-muted">{tbdLabel}</span>
        </>
      )}
      <span
        className={`ml-auto font-mono text-sm ${
          winner ? "font-semibold" : "text-arena-muted"
        }`}
      >
        {score != null ? score : "–"}
      </span>
    </Wrapper>
  );
}
