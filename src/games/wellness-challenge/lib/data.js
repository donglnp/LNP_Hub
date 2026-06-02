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

export function isoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return { year: d.getUTCFullYear(), week };
}

export function weekKey(date) {
  const { year, week } = isoWeek(date);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

export function startOfIsoWeek(date) {
  const d = new Date(date);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - (day - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfIsoWeek(date) {
  const start = startOfIsoWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
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

export function daysLeftInWeek(now = new Date()) {
  const end = endOfIsoWeek(now);
  return Math.max(0, Math.ceil((end - now) / 86400000));
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

export function sumKcalThisWeek(entries, now = new Date()) {
  const start = startOfIsoWeek(now).getTime();
  const end = endOfIsoWeek(now).getTime();
  return entries
    .filter((e) => {
      const t = new Date(e.entry_date || e.date).getTime();
      return t >= start && t <= end && (e.status ?? "approved") === "approved";
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

export function weeksMetKpi(entries, gender) {
  const byWeek = new Map();
  for (const e of entries) {
    if ((e.status ?? "approved") !== "approved") continue;
    const d = new Date(e.entry_date || e.date);
    if (d < PROGRAM.startDate || d > PROGRAM.endDate) continue;
    const key = weekKey(d);
    const prev = byWeek.get(key) || { kcal: 0, month: d.getMonth() + 1 };
    prev.kcal += e.kcal || 0;
    byWeek.set(key, prev);
  }
  let hit = 0;
  for (const { kcal, month } of byWeek.values()) {
    if (kcal >= weeklyKpi(gender, month)) hit++;
  }
  return hit;
}
