# Wellness Leaderboard — Month-Grouped History Popup

## Problem

On `wellness-challenge/leaderboard`, clicking a row opens `UserHistoryModal` showing
that user's full entry history in one flat table, regardless of which month tab
("All" / 6 / 7 / 8) is currently selected on the leaderboard. This is inconsistent
with the leaderboard table itself, which does filter kcal/target by the selected
month, and makes it hard to see a specific month's entries at a glance.

## Design

Group `UserHistoryModal`'s entries into three fixed accordion sections, one per
program month (6, 7, 8, in that order — matching `MONTH_TABS`). No new data
fetching; this is purely a reorganization of the entries already loaded into
`Leaderboard`.

**Per-month section:**
- Header: month label (`t("wc.month_6")` etc.), entry count, and kcal subtotal for
  that month only. Clicking toggles the section open/closed (chevron indicator).
- If a month has zero entries, its header still renders ("0" count) but is not
  clickable/expandable (no body to show).
- Body: the existing entries table (same columns as today), rendered only while
  the section is open. Row order within a section is preserved as returned by
  `fetchAllEntries` (already `entry_date desc`) — no re-sort needed.

**Initial expand state**, driven by the leaderboard's currently selected `month`
tab (passed into the modal as a new prop):
- `month === "all"` → all three sections start expanded.
- `month === "6" | "7" | "8"` → only that section starts expanded; the other two
  start collapsed.

Sections are independent — the user can open/close any of them afterward, and
multiple can be open simultaneously (not an exclusive accordion).

The modal's top header (total entry count + total kcal across all months) is
unchanged.

## Scope / non-goals

- No change to leaderboard filtering, kcal totals, or KPI targets.
- No change to data fetching — `entries` prop passed to the modal is unchanged.
- Entries outside months 6/7/8 are not expected (program runs Jun 1–Aug 31 2026)
  and are out of scope, consistent with how `MONTH_TABS` / `sumKcalInMonth`
  already only handle these three months.

## Files touched

- `src/games/wellness-challenge/pages/Leaderboard.jsx` — pass `month` into
  `UserHistoryModal`; replace its flat table with the three collapsible sections.
