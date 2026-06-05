# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**LNP Hub** — an internal Vite + React 19 + React Router 7 + Supabase platform for LNP
Technologies employees. One Google sign-in gates a catalog of self-contained mini-games
(Wellness Challenge, World Cup 2026, Lucky Wheel, Coworking Day, Secret Santa). UI is
trilingual: English / Tiếng Việt / 日本語.

## Commands

```bash
npm run dev      # Vite dev server on :5173 (also proxies /api/fd/* — see Match data)
npm run build    # production build to dist/
npm run lint     # ESLint over the repo
npm run preview  # serve the built dist/
```

There is **no test runner and no TypeScript** — this is plain JSX. ESLint (flat config in
`eslint.config.js`) is the only automated check.

Local env lives in `.env` (gitignored). At minimum set `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY`; without them the Supabase clients are `null` and the app runs in
a degraded, mostly read-nothing state (see "Graceful degradation" below). See `README.md`
for full Supabase / Google OAuth / Vercel setup.

## Architecture

### Hub shell + lazy game modules

`src/App.jsx` is the whole router. It wraps everything in `ThemeProvider → I18nProvider →
BrowserRouter → AuthProvider`, then mounts each game as a **lazily-imported module** at
`/<slug>/*`, all behind a single `<ProtectedRoute>` (requires a session). `/admin/*` lives
behind an additional `<AdminRoute>` (requires `profile.is_admin`).

Each game is a fully self-contained folder under `src/games/<slug>/`:

```
src/games/<slug>/
  index.jsx        default export = the game's own nested <Routes> (mounts its Layout + pages)
  components/      game-local components (each game has its own Layout)
  lib/             game-local data access + helpers
  pages/           route screens
```

The game's `index.jsx` owns its internal routing — `App.jsx` only knows the top-level
`/<slug>/*` prefix. Games read the current user via `useAuth()` from the shared
`src/lib/AuthContext.jsx`; they do not receive it through context boundaries other than that.

**To add a game:** create `src/games/<slug>/index.jsx` with a nested `<Routes>`, add a
`lazy(() => import("./games/<slug>"))` + `<Route path="/<slug>/*">` in `App.jsx`, add a card
object in `src/pages/Catalog.jsx`, add its i18n keys, and (if it persists data) add a schema
file in `supabase/`.

### Auth & profile

`src/lib/AuthContext.jsx` is the single source of truth: it tracks the Supabase `session`,
derives a display `user` (`userDisplay` in `auth.js`), and separately fetches the `profiles`
row to expose `profile`, `isAdmin` (`profile.is_admin`), and `ready` (true only once both
session and profile have resolved — gate redirects on this, not on `user` alone). Auth is
**Google OAuth only** (`signInWithGoogle` in `src/lib/auth.js`), no magic link.

### Two Supabase clients

- `src/lib/supabaseHub.js` (`supabaseHub`) — the shared hub client, used by auth, profiles,
  and most games. Reads `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.
- `src/games/wc/lib/supabase.js` (`supabase`) — World Cup's client, which prefers
  `VITE_WC_SUPABASE_*` and falls back to the hub vars. This lets WC optionally live in a
  separate Supabase project.

**Graceful degradation:** both clients are `null` when their env vars are absent, and every
data helper guards on that (`if (!supabaseHub) return [] / return null`). Preserve this
pattern — never assume a client is non-null inside a lib function.

### Data layer per game

Persistence is **per-game and not uniform**:
- Supabase-backed: `wellness-challenge`, `wc`, `coworking-day`, `secret-santa`.
- `localStorage`-backed (no DB): `lucky-wheel`, plus client-side caches in some others.

Data access is isolated in each game's `lib/` (e.g. `wellness/lib/wellness.js`,
`wc/lib/predictions.js`). Components call these helpers; they don't query Supabase directly.

### Database schemas (Supabase)

SQL lives in `supabase/*.sql`, one file per area, all idempotent (safe to re-run in the
SQL editor): `hub-schema.sql` (shared `profiles` + `games`), `wc-schema.sql`,
`wellness-schema.sql`, `coworking-schema.sql`, `santa-schema.sql`. Access control is
enforced by **Postgres RLS policies defined in these files** — e.g. wellness entries are
admin-write / authenticated-read, predictions are owner-write. Some tables are added to the
`supabase_realtime` publication (predictions, match_results, wellness_entries) for live
updates. When you change a table's columns or access rules, update the corresponding `.sql`.

### i18n

All user-facing strings go through `src/lib/i18n.jsx`: a single flat `dict` keyed by
`"namespace.key"`, each entry holding `{ en, vi, ja }`. Components use the `useT()` hook →
`t("catalog.welcome")`, with `{param}` interpolation via `t(key, { date })`. **Never hardcode
display text** — add a key with all three languages. Language choice persists to
`localStorage` under `arena-lang`.

### Theming

`src/lib/ThemeContext.jsx` manages light/dark/system (persisted under `arena-theme`) by
toggling a class/attribute that flips the `--arena-*` CSS variables. Tailwind exposes these
as `arena-*` color tokens (`bg-arena-bg`, `text-arena-blue`, `border-arena-border`, etc. —
see `tailwind.config.js`). Style with these tokens, not raw hex, so both themes work.

### Match data proxy (World Cup)

football-data.org is CORS-restricted and the token must stay server-side, so requests go
through `/api/fd/*`:
- **Dev:** `vite.config.js` proxies `/api/fd/*` → `api.football-data.org/v4`, injecting
  `X-Auth-Token` from `FD_TOKEN`/`VITE_FD_TOKEN`.
- **Prod (Vercel):** `vercel.json` rewrites `/api/fd/:path*` → `/api/fd?p=:path*`, handled by
  the serverless function `api/fd.js` which injects `FD_TOKEN` (no `VITE_` prefix → never in
  the client bundle).

`wc/lib/wcApi.js` falls back football-data.org → TheSportsDB → bundled mock
(`wc/lib/mockData.js`) so the game works even with no token.

### Deployment

SPA on Vercel. `vercel.json` rewrites all non-`/api/` paths to `index.html` so React Router
deep links work. Env vars on Vercel: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (build-time,
client-safe) and `FD_TOKEN` (server-only).
