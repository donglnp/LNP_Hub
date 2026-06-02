import { useEffect, useMemo, useState } from "react";
import { supabaseHub } from "../../../lib/supabaseHub";
import { useAuth } from "../../../lib/AuthContext";
import { useT } from "../../../lib/i18n";
import MonthGrid from "../components/MonthGrid";
import DayDetailModal from "../components/DayDetailModal";
import PatternEditor from "../components/PatternEditor";
import {
  getMonthGrid,
  monthRangeISO,
  toISODate,
  expandPatternDates,
} from "../lib/dates";

const PATTERN_WEEKS_AHEAD = 4;

export default function Play() {
  const { user } = useAuth();
  const { t } = useT();

  const today = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const weeks = useMemo(
    () => getMonthGrid(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  const [initialLoading, setInitialLoading] = useState(true);
  const [navLoading, setNavLoading] = useState(false);
  const [attendance, setAttendance] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [pattern, setPattern] = useState([]);
  const [busyDate, setBusyDate] = useState(null);
  const [savingPattern, setSavingPattern] = useState(false);
  const [modalDate, setModalDate] = useState(null);

  // Fetches data for (y, m) then commits view + data atomically. This is what
  // prevents the flicker when navigating months — the grid never renders the
  // new month with stale (empty) attendance.
  async function loadMonth(y, m, { isInitial = false } = {}) {
    if (!supabaseHub || !user) return;
    if (isInitial) setInitialLoading(true);
    else setNavLoading(true);
    try {
      const { from, to } = monthRangeISO(y, m);

      const [profsRes, attRes, patRes] = await Promise.all([
        supabaseHub.from("profiles").select("id, full_name, avatar_url"),
        supabaseHub
          .from("coworking_attendance")
          .select("user_id, date, source, dismissed")
          .gte("date", from)
          .lt("date", to),
        supabaseHub
          .from("coworking_patterns")
          .select("weekdays")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

      if (profsRes.error) throw profsRes.error;
      if (attRes.error) throw attRes.error;
      if (patRes.error) throw patRes.error;

      const profMap = {};
      (profsRes.data || []).forEach((p) => {
        profMap[p.id] = p;
      });

      let nextAttendance = attRes.data || [];

      // Auto-expand pattern: only when viewing current/future months. Insert
      // missing rows first so we can commit the final list in one setState.
      const userPattern = patRes.data?.weekdays || [];
      const isCurrentOrFuture =
        y > today.getFullYear() ||
        (y === today.getFullYear() && m >= today.getMonth());

      if (userPattern.length > 0 && isCurrentOrFuture) {
        const desired = expandPatternDates(userPattern, PATTERN_WEEKS_AHEAD, today);
        const inView = desired.filter((d) => d >= from && d < to);
        const existing = new Set(
          nextAttendance.filter((a) => a.user_id === user.id).map((a) => a.date)
        );
        const missing = inView.filter((d) => !existing.has(d));
        if (missing.length > 0) {
          const rows = missing.map((date) => ({
            user_id: user.id,
            date,
            source: "pattern",
          }));
          const { error: insErr } = await supabaseHub
            .from("coworking_attendance")
            .insert(rows);
          if (!insErr) nextAttendance = [...nextAttendance, ...rows];
        }
      }

      // Atomic commit: view month + data swap together.
      setProfiles(profMap);
      setAttendance(nextAttendance);
      setPattern(userPattern);
      setViewYear(y);
      setViewMonth(m);
    } catch (e) {
      console.error("[coworking-day] loadMonth error", e);
    } finally {
      setInitialLoading(false);
      setNavLoading(false);
    }
  }

  useEffect(() => {
    if (!user) return;
    loadMonth(today.getFullYear(), today.getMonth(), { isInitial: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const attendanceByDate = useMemo(() => {
    const map = {};
    for (const a of attendance) {
      if (a.dismissed) continue;
      if (!map[a.date]) map[a.date] = [];
      map[a.date].push(a);
    }
    return map;
  }, [attendance]);

  async function toggleDay(iso) {
    if (!user || busyDate) return;
    setBusyDate(iso);
    const mine = attendance.find((a) => a.user_id === user.id && a.date === iso);
    try {
      if (mine && !mine.dismissed) {
        // Soft-dismiss: keep the row as a tombstone so pattern auto-fill
        // doesn't re-insert it on the next load.
        const { error } = await supabaseHub
          .from("coworking_attendance")
          .update({ dismissed: true })
          .eq("user_id", user.id)
          .eq("date", iso);
        if (error) throw error;
        setAttendance((prev) =>
          prev.map((a) =>
            a.user_id === user.id && a.date === iso ? { ...a, dismissed: true } : a
          )
        );
      } else if (mine && mine.dismissed) {
        // Un-dismiss existing row.
        const { error } = await supabaseHub
          .from("coworking_attendance")
          .update({ dismissed: false })
          .eq("user_id", user.id)
          .eq("date", iso);
        if (error) throw error;
        setAttendance((prev) =>
          prev.map((a) =>
            a.user_id === user.id && a.date === iso ? { ...a, dismissed: false } : a
          )
        );
      } else {
        const row = { user_id: user.id, date: iso, source: "manual", dismissed: false };
        const { error } = await supabaseHub
          .from("coworking_attendance")
          .insert(row);
        if (error) throw error;
        setAttendance((prev) => [...prev, { ...row }]);
      }
    } catch (e) {
      console.error("[coworking-day] toggleDay error", e);
    } finally {
      setBusyDate(null);
    }
  }

  async function savePattern(weekdays) {
    if (!user || savingPattern) return;
    setSavingPattern(true);
    try {
      const { error: upErr } = await supabaseHub
        .from("coworking_patterns")
        .upsert(
          { user_id: user.id, weekdays, updated_at: new Date().toISOString() },
          { onConflict: "user_id" }
        );
      if (upErr) throw upErr;
      setPattern(weekdays);

      if (weekdays.length > 0) {
        const desired = expandPatternDates(weekdays, PATTERN_WEEKS_AHEAD, today);
        const { from, to } = monthRangeISO(viewYear, viewMonth);
        const inView = desired.filter((d) => d >= from && d < to);
        const existing = new Set(
          attendance.filter((a) => a.user_id === user.id).map((a) => a.date)
        );
        const missing = inView.filter((d) => !existing.has(d));
        if (missing.length > 0) {
          const rows = missing.map((date) => ({
            user_id: user.id,
            date,
            source: "pattern",
          }));
          const { error: insErr } = await supabaseHub
            .from("coworking_attendance")
            .insert(rows);
          if (insErr) throw insErr;
          setAttendance((prev) => [...prev, ...rows]);
        }
      }
    } catch (e) {
      console.error("[coworking-day] savePattern error", e);
    } finally {
      setSavingPattern(false);
    }
  }

  function gotoMonth(deltaMonths) {
    if (navLoading) return;
    let y = viewYear;
    let m = viewMonth + deltaMonths;
    while (m < 0) {
      m += 12;
      y -= 1;
    }
    while (m > 11) {
      m -= 12;
      y += 1;
    }
    loadMonth(y, m);
  }

  const canGoPrev =
    viewYear > today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth > today.getMonth());

  if (initialLoading) {
    return (
      <div className="min-h-[60vh] grid place-items-center text-arena-muted text-sm">
        {t("common.loading")}
      </div>
    );
  }

  const modalIso = modalDate ? toISODate(modalDate) : null;
  const modalAttendees = modalIso ? attendanceByDate[modalIso] || [] : [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <header className="mb-8 text-center">
        <p className="text-[10px] tracking-[0.4em] uppercase text-arena-blue">
          🏢 {t("coworking.tag")}
        </p>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl font-semibold">
          {t("coworking.title")}
        </h1>
        <p className="mt-2 text-sm text-arena-muted max-w-xl mx-auto">
          {t("coworking.tagline")}
        </p>
      </header>

      <div className="grid md:grid-cols-3 gap-6 sm:gap-8 items-start">
        <div className="md:col-span-2">
          <MonthGrid
            year={viewYear}
            month={viewMonth}
            weeks={weeks}
            attendanceByDate={attendanceByDate}
            profiles={profiles}
            currentUserId={user?.id}
            today={today}
            onPickDay={(_iso, date) => setModalDate(date)}
            onPrev={() => gotoMonth(-1)}
            onNext={() => gotoMonth(1)}
            canGoPrev={canGoPrev}
            navBusy={navLoading}
          />
        </div>

        <aside className="space-y-6">
          <PatternEditor
            initial={pattern}
            onSave={savePattern}
            saving={savingPattern}
          />

          <div className="rounded-lg border border-arena-border bg-arena-surface p-5 text-xs text-arena-muted leading-relaxed">
            <h3 className="font-display text-sm font-semibold text-arena-text mb-2">
              💡 {t("coworking.tips_title")}
            </h3>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>{t("coworking.tip_1")}</li>
              <li>{t("coworking.tip_2")}</li>
              <li>{t("coworking.tip_3")}</li>
            </ul>
          </div>
        </aside>
      </div>

      <DayDetailModal
        open={Boolean(modalDate)}
        isoDate={modalIso}
        date={modalDate}
        attendees={modalAttendees}
        profiles={profiles}
        currentUserId={user?.id}
        busy={busyDate === modalIso}
        onClose={() => setModalDate(null)}
        onToggle={toggleDay}
      />
    </div>
  );
}
