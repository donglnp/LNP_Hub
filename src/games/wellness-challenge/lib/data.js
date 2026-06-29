// Pure helpers for the Wellness Challenge — KPI, dates, lookup tables.
// Live data lives in the hub Supabase (see lib/wellness.js).

export const PROGRAM = {
  startDate: new Date("2026-06-01"),
  endDate: new Date("2026-08-31T23:59:59"),
  months: [
    { month: 6, label: "Tháng 6", monthIdx: 1 },
    { month: 7, label: "Tháng 7", monthIdx: 2 },
    { month: 8, label: "Tháng 8", monthIdx: 3 },
  ],
};

export const WEEKLY_KPI = {
  male: { 6: 1250, 7: 1500, 8: 1750 },
  female: { 6: 1000, 7: 1250, 8: 1500 },
};

export const EXERCISE_TYPES = [
  { id: "run", label: "Chạy bộ", icon: "🏃" },
  { id: "walk", label: "Đi bộ", icon: "🚶" },
  { id: "cycle", label: "Đạp xe", icon: "🚴" },
  { id: "swim", label: "Bơi lội", icon: "🏊" },
  { id: "gym", label: "Tập gym", icon: "🏋️" },
  { id: "other", label: "Khác", icon: "💪" },
];

export const DEVICES = [
  { id: "apple_watch", label: "Apple Watch" },
  { id: "garmin", label: "Garmin" },
  { id: "fitbit", label: "Fitbit" },
  { id: "strava", label: "Strava" },
  { id: "gym_machine", label: "Máy tập tại gym" },
  { id: "apple_health", label: "Apple Health" },
  { id: "google_fit", label: "Google Fit" },
  { id: "other", label: "Khác" },
];

export const PRIZES = [
  {
    id: "monthly_kpi",
    icon: "🏅",
    title: "Đạt KPI hàng tháng",
    amount: "500.000 VND / người / tháng",
  },
  {
    id: "top_burner",
    icon: "🔥",
    title: "Calo cao nhất tháng (1 nam + 1 nữ)",
    amount: "500.000 VND / người / tháng",
  },
  {
    id: "streak",
    icon: "⭐",
    title: "Đạt KPI 3 tháng liên tiếp",
    amount: "500.000 VND / người",
  },
];

export function weeklyKpi(gender, monthNum) {
  return WEEKLY_KPI[gender]?.[monthNum] ?? 0;
}

export function monthlyKpi(gender, monthNum) {
  return weeklyKpi(gender, monthNum) * 4;
}

// ---- month-anchored weeks ----
// A "week" is a bucket of days within a month, ignoring weekday:
//   week 1 = days 1–7, week 2 = 8–14, week 3 = 15–21, week 4 = 22–28.
// Days 29/30/31 are "leftover" days: no weekly KPI of their own (rest / make-up).
// Their kcal still counts toward the month total (see sumKcalThisMonth).

export function isLeftoverDay(date) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.getDate() >= 29;
}

// Returns 1..4 for a regular week, or 0 for a leftover day (29–31).
export function monthWeekIndex(date) {
  const d = typeof date === "string" ? new Date(date) : date;
  const day = d.getDate();
  if (day >= 29) return 0;
  return Math.floor((day - 1) / 7) + 1;
}

// Days remaining (inclusive of today) in the current month-week, 0 on leftover days.
export function daysLeftInMonthWeek(now = new Date()) {
  const ref = clampToProgram(now);
  const idx = monthWeekIndex(ref);
  if (idx === 0) return 0;
  return Math.max(0, idx * 7 - ref.getDate() + 1);
}

export function formatDate(d) {
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateShort(d) {
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

export function programState(now = new Date()) {
  if (now < PROGRAM.startDate) return "upcoming";
  if (now > PROGRAM.endDate) return "ended";
  return "running";
}

export function clampToProgram(now = new Date()) {
  if (now < PROGRAM.startDate) return new Date(PROGRAM.startDate);
  if (now > PROGRAM.endDate) return new Date(PROGRAM.endDate);
  return now;
}

export function currentMonthInfo(now = new Date()) {
  const ref = clampToProgram(now);
  const m = ref.getMonth() + 1;
  return PROGRAM.months.find((x) => x.month === m) || PROGRAM.months[0];
}

export function programProgress(now = new Date()) {
  const total = PROGRAM.endDate - PROGRAM.startDate;
  const done = Math.max(0, Math.min(total, now - PROGRAM.startDate));
  return Math.round((done / total) * 100);
}

export function daysUntil(date, now = new Date()) {
  return Math.max(0, Math.ceil((date - now) / 86400000));
}

export function findExercise(id) {
  return EXERCISE_TYPES.find((e) => e.id === id) || EXERCISE_TYPES[5];
}

export function findDevice(id) {
  return DEVICES.find((d) => d.id === id);
}

// ---- aggregation over entries[] ----

// Sum of the CURRENT month-week (the days-1–7/8–14/... bucket today falls in).
// Returns 0 on leftover days (29–31), which have no weekly KPI.
export function sumKcalThisMonthWeek(entries, now = new Date()) {
  const ref = clampToProgram(now);
  const idx = monthWeekIndex(ref);
  if (idx === 0) return 0;
  const m = ref.getMonth();
  const y = ref.getFullYear();
  return entries
    .filter((e) => {
      const d = new Date(e.entry_date || e.date);
      return (
        d.getMonth() === m &&
        d.getFullYear() === y &&
        monthWeekIndex(d) === idx &&
        (e.status ?? "approved") === "approved"
      );
    })
    .reduce((sum, e) => sum + (e.kcal || 0), 0);
}

export function sumKcalThisMonth(entries, now = new Date()) {
  const ref = clampToProgram(now);
  const m = ref.getMonth();
  const y = ref.getFullYear();
  return entries
    .filter((e) => {
      const d = new Date(e.entry_date || e.date);
      return (
        d.getMonth() === m &&
        d.getFullYear() === y &&
        (e.status ?? "approved") === "approved"
      );
    })
    .reduce((sum, e) => sum + (e.kcal || 0), 0);
}

export function sumKcalInMonth(entries, monthNum) {
  return entries
    .filter((e) => {
      const d = new Date(e.entry_date || e.date);
      return (
        d.getMonth() + 1 === monthNum && (e.status ?? "approved") === "approved"
      );
    })
    .reduce((sum, e) => sum + (e.kcal || 0), 0);
}

export function sumKcalTotal(entries) {
  return entries
    .filter((e) => (e.status ?? "approved") === "approved")
    .reduce((sum, e) => sum + (e.kcal || 0), 0);
}

// Counts month-weeks (4 per month) whose total kcal met that month's weekly KPI.
// Leftover days (29–31) form no week and are ignored here.
export function weeksMetKpi(entries, gender) {
  const byWeek = new Map(); // key: `${month}-${weekIdx}`
  for (const e of entries) {
    if ((e.status ?? "approved") !== "approved") continue;
    const d = new Date(e.entry_date || e.date);
    if (d < PROGRAM.startDate || d > PROGRAM.endDate) continue;
    const weekIdx = monthWeekIndex(d);
    if (weekIdx === 0) continue; // leftover day → no weekly KPI
    const month = d.getMonth() + 1;
    const key = `${month}-${weekIdx}`;
    const prev = byWeek.get(key) || { kcal: 0, month };
    prev.kcal += e.kcal || 0;
    byWeek.set(key, prev);
  }
  let hit = 0;
  for (const { kcal, month } of byWeek.values()) {
    if (kcal >= weeklyKpi(gender, month)) hit++;
  }
  return hit;
}
