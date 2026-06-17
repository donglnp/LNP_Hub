// Top scorers ("bảng xếp hạng ghi bàn") data layer.
//
// Order of preference (mirrors wcApi.js):
//   1. football-data.org /competitions/WC/scorers — needs token via /api/fd proxy
//   2. Static MOCK_SCORERS fallback so the UI always renders
//
// Normalized scorer shape the UI expects:
//   { name, teamCode, teamName, teamFlag, goals, assists, penalties, played }
//
// TheSportsDB has no free top-scorers endpoint for the WC, so there is no
// middle tier here — we go straight from football-data to mock.

const FD_PROXY = import.meta.env.VITE_FD_PROXY || "/api/fd";
const FD_ENABLED = import.meta.env.DEV
  ? import.meta.env.VITE_FD_ENABLED !== "0"
  : true;
// football-data.org has no player photos, so headshots come from TheSportsDB
// (free, no key) looked up by player name — same source the squads loader uses.
const SPORTSDB_BASE = "https://www.thesportsdb.com/api/v1/json/3";

const FLAG_BY_CODE = {
  ARG: "🇦🇷", BRA: "🇧🇷", FRA: "🇫🇷", ENG: "🏴", ESP: "🇪🇸", GER: "🇩🇪",
  POR: "🇵🇹", NED: "🇳🇱", BEL: "🇧🇪", ITA: "🇮🇹", CRO: "🇭🇷", URU: "🇺🇾",
  USA: "🇺🇸", MEX: "🇲🇽", CAN: "🇨🇦", JPN: "🇯🇵", KOR: "🇰🇷", MAR: "🇲🇦",
  SEN: "🇸🇳", AUS: "🇦🇺", SUI: "🇨🇭", DEN: "🇩🇰", POL: "🇵🇱", ECU: "🇪🇨",
  SRB: "🇷🇸", GHA: "🇬🇭",
};

function flagFor(code) {
  return FLAG_BY_CODE[code?.toUpperCase()] || "🏳️";
}

function toCode(s, fallback = "") {
  return (s || fallback || "").slice(0, 3).toUpperCase();
}

// Minimal stand-in so the page is never empty before/without a token.
const MOCK_SCORERS = [
  { name: "K. Mbappé", teamCode: "FRA", teamName: "France", goals: 6, assists: 2, penalties: 1, played: 5 },
  { name: "L. Messi", teamCode: "ARG", teamName: "Argentina", goals: 5, assists: 3, penalties: 1, played: 5 },
  { name: "Vinícius Jr.", teamCode: "BRA", teamName: "Brazil", goals: 4, assists: 1, penalties: 0, played: 5 },
  { name: "H. Kane", teamCode: "ENG", teamName: "England", goals: 4, assists: 0, penalties: 2, played: 5 },
  { name: "C. Ronaldo", teamCode: "POR", teamName: "Portugal", goals: 3, assists: 1, penalties: 1, played: 5 },
].map((s) => ({ ...s, teamFlag: flagFor(s.teamCode) }));

async function fdFetch(path) {
  const res = await fetch(`${FD_PROXY}${path}`);
  if (!res.ok) throw new Error(`football-data ${res.status}`);
  return res.json();
}

async function fdLoadScorers() {
  // limit caps the list server-side; 20 is plenty for a leaderboard.
  const json = await fdFetch("/competitions/WC/scorers?limit=20");
  const scorers = (json.scorers || []).map((s) => {
    const code = toCode(s.team?.tla, s.team?.shortName);
    return {
      name: s.player?.name || "—",
      teamCode: code,
      teamName: s.team?.shortName || s.team?.name || code,
      teamFlag: s.team?.crest || flagFor(code),
      goals: s.goals ?? 0,
      assists: s.assists ?? 0,
      penalties: s.penalties ?? 0,
      played: s.playedMatches ?? 0,
    };
  });
  return { scorers, matchday: json.season?.currentMatchday ?? null };
}

// name → photo URL (or null). Cached so the 2-min auto-refresh never refetches.
const photoCache = new Map();

export async function loadScorerPhoto(name) {
  if (!name) return null;
  if (photoCache.has(name)) return photoCache.get(name);
  let url = null;
  try {
    const res = await fetch(
      `${SPORTSDB_BASE}/searchplayers.php?p=${encodeURIComponent(name)}`
    );
    if (res.ok) {
      const json = await res.json();
      const p = (json.player || []).find((x) => /soccer/i.test(x.strSport));
      url = p?.strCutout || p?.strThumb || null;
    }
  } catch (e) {
    console.warn("[scorers] photo failed:", name, e.message);
  }
  photoCache.set(name, url);
  return url;
}

export async function loadScorers() {
  if (FD_ENABLED) {
    try {
      const { scorers, matchday } = await fdLoadScorers();
      if (scorers.length)
        return { scorers, source: "football-data.org", matchday };
    } catch (e) {
      console.warn("[scorers] football-data failed:", e.message);
    }
  }
  return { scorers: MOCK_SCORERS, source: "mock", matchday: null };
}
