// Local-time date helpers for the Coworking day mini-app.
// Everything keys off the user's local Monday so the UI matches what people
// see on their calendars.

export const WEEKDAYS = [1, 2, 3, 4, 5]; // ISO Mon..Fri

export function isoWeekday(date) {
  // JS getDay: Sun=0..Sat=6 → ISO Mon=1..Sun=7
  const d = date.getDay();
  return d === 0 ? 7 : d;
}

export function startOfWeek(ref = new Date()) {
  const d = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  const offset = isoWeekday(d) - 1;
  d.setDate(d.getDate() - offset);
  return d;
}

export function addDays(date, n) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() + n);
  return d;
}

export function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getWorkdays(weekStart) {
  // Mon..Fri of the given week start
  return WEEKDAYS.map((_, i) => addDays(weekStart, i));
}

export function getTwoWeekWorkdays(ref = new Date()) {
  const w0 = startOfWeek(ref);
  return [getWorkdays(w0), getWorkdays(addDays(w0, 7))];
}

export function expandPatternDates(weekdays, weeksAhead, ref = new Date()) {
  // Returns ISO date strings for the next `weeksAhead` weeks, starting from
  // today (skip past days in the current week).
  const today = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  const w0 = startOfWeek(today);
  const result = [];
  for (let w = 0; w < weeksAhead; w++) {
    for (const wd of weekdays) {
      const d = addDays(w0, w * 7 + (wd - 1));
      if (d >= today) result.push(toISODate(d));
    }
  }
  return result;
}

const WD_LABEL_EN = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const WD_LABEL_VI = ["T2", "T3", "T4", "T5", "T6"];
const WD_LABEL_JA = ["月", "火", "水", "木", "金"];

export function weekdayLabel(wd, lang) {
  const arr = lang === "vi" ? WD_LABEL_VI : lang === "ja" ? WD_LABEL_JA : WD_LABEL_EN;
  return arr[wd - 1] ?? "";
}

export function formatDayShort(date, lang) {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  if (lang === "vi") return `${d}/${m}`;
  if (lang === "ja") return `${m}/${d}`;
  return `${m}/${d}`;
}

export function getMonthGrid(year, month) {
  // Returns array of weeks; each week is an array of 5 cells {date, inMonth}
  // representing Mon..Fri. Days outside the month are kept for column alignment
  // but flagged inMonth=false.
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0); // last day of month
  const startMon = startOfWeek(first);
  // End at the Friday of the week containing the last day
  const lastWeekMon = startOfWeek(last);
  const endFri = addDays(lastWeekMon, 4);
  const weeks = [];
  let cursor = startMon;
  while (cursor <= endFri) {
    const row = [];
    for (let i = 0; i < 5; i++) {
      const d = addDays(cursor, i);
      row.push({ date: d, inMonth: d.getMonth() === month });
    }
    weeks.push(row);
    cursor = addDays(cursor, 7);
  }
  return weeks;
}

export function monthRangeISO(year, month) {
  const from = new Date(year, month, 1);
  const to = new Date(year, month + 1, 1);
  return { from: toISODate(from), to: toISODate(to) };
}

const MONTH_LABEL_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTH_LABEL_VI = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];
const MONTH_LABEL_JA = [
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月",
];

export function monthLabel(month, year, lang) {
  const arr = lang === "vi" ? MONTH_LABEL_VI : lang === "ja" ? MONTH_LABEL_JA : MONTH_LABEL_EN;
  return `${arr[month]} ${year}`;
}

export function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
