import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../lib/AuthContext";
import { useT, localeOf, formatNum } from "../../../lib/i18n";
import {
  fetchMyEntries,
  subscribeEntries,
  deleteMyPendingEntry,
  updateMyPendingEntry,
} from "../lib/wellness";
import {
  PROGRAM,
  DEVICES,
  EXERCISE_TYPES,
  findDevice,
  findExercise,
} from "../lib/data";

export default function History() {
  const { user } = useAuth();
  const { t, lang } = useT();
  const locale = localeOf(lang);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState("all");
  const [editing, setEditing] = useState(null);

  const MONTHS = [
    { value: "all", label: t("wc.history_filter_all") },
    { value: "6", label: t("wc.month_6") },
    { value: "7", label: t("wc.month_7") },
    { value: "8", label: t("wc.month_8") },
  ];

  useEffect(() => {
    if (!user?.id) return;
    let alive = true;
    async function load() {
      setLoading(true);
      const data = await fetchMyEntries(user.id);
      if (!alive) return;
      setEntries(data);
      setLoading(false);
    }
    load();
    const off = subscribeEntries(load);
    return () => {
      alive = false;
      off();
    };
  }, [user?.id]);

  const filtered = useMemo(() => {
    if (month === "all") return entries;
    return entries.filter(
      (e) => String(new Date(e.entry_date).getMonth() + 1) === month
    );
  }, [entries, month]);

  const total = filtered.reduce((s, e) => s + (e.kcal || 0), 0);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] tracking-[0.4em] uppercase text-arena-amber">
            {t("wc.history_header_meta", {
              count: filtered.length,
              kcal: formatNum(total, lang),
            })}
          </p>
          <h1 className="font-display text-3xl font-semibold mt-2">
            {t("wc.history_title")}
          </h1>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {MONTHS.map((m) => (
          <button
            key={m.value}
            onClick={() => setMonth(m.value)}
            className={`px-3 py-1.5 text-xs rounded-md border transition ${
              month === m.value
                ? "border-arena-amber text-arena-amber bg-arena-amber/10"
                : "border-arena-border text-arena-muted hover:text-arena-text"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <section className="rounded-lg border border-arena-border bg-arena-surface overflow-x-auto">
        {loading ? (
          <p className="py-12 text-sm text-arena-muted text-center">
            {t("wc.loading")}
          </p>
        ) : filtered.length === 0 ? (
          <p className="py-12 text-sm text-arena-muted text-center">
            {t("wc.history_empty")}
          </p>
        ) : (
          <table className="w-full text-sm min-w-[680px]">
            <thead>
              <tr className="text-[10px] tracking-[0.25em] uppercase text-arena-muted border-b border-arena-border">
                <th className="px-4 py-3 text-left font-medium">{t("wc.history_col_date")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("wc.history_col_type")}</th>
                <th className="px-4 py-3 text-right font-medium">{t("wc.history_col_duration")}</th>
                <th className="px-4 py-3 text-right font-medium">{t("wc.history_col_kcal")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("wc.history_col_device")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("wc.history_col_photos")}</th>
                <th className="px-4 py-3 text-left font-medium">{t("wc.history_col_status")}</th>
                <th className="px-4 py-3 text-right font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => {
                const ex = findExercise(e.exercise_type);
                const dev = findDevice(e.device);
                const dateStr = new Date(e.entry_date).toLocaleDateString(
                  locale,
                  { day: "2-digit", month: "2-digit", year: "numeric" }
                );
                return (
                  <tr
                    key={e.id}
                    className="border-b border-arena-border/60 last:border-0 hover:bg-arena-card/50"
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-arena-muted">
                      {dateStr}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2">
                        <span className="text-lg">{ex.icon}</span>
                        {e.exercise_type === "other" && e.exercise_other
                          ? e.exercise_other
                          : t(`wc.ex_${ex.id}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {e.duration_min}{" "}
                      <span className="text-arena-muted">
                        {t("wc.minutes_short")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-arena-amber font-semibold">
                      {formatNum(e.kcal, lang)}
                    </td>
                    <td className="px-4 py-3 text-arena-muted text-xs">
                      {e.device === "other" && e.device_other
                        ? e.device_other
                        : dev
                        ? t(`wc.dev_${dev.id}`)
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <PhotoChip url={e.photo_before_url} />
                        <PhotoChip url={e.photo_after_url} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={e.status} t={t} />
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {e.status === "pending" && e.user_id === user?.id ? (
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => setEditing(e)}
                            className="text-xs text-arena-amber hover:underline"
                          >
                            {t("wc.history_btn_edit")}
                          </button>
                          <button
                            onClick={async () => {
                              if (!confirm(t("wc.history_confirm_delete"))) return;
                              try {
                                await deleteMyPendingEntry(user.id, e.id);
                              } catch (err) {
                                alert(err.message || String(err));
                              }
                            }}
                            className="text-xs text-arena-red hover:underline"
                          >
                            {t("wc.history_btn_delete")}
                          </button>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      <p className="text-[11px] text-arena-muted">
        {t("wc.history_program_range", {
          start: PROGRAM.startDate.toLocaleDateString(locale),
          end: PROGRAM.endDate.toLocaleDateString(locale),
        })}
      </p>

      {editing && (
        <EditModal
          entry={editing}
          userId={user?.id}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function EditModal({ entry, userId, onClose }) {
  const { t } = useT();
  const [form, setForm] = useState({
    entry_date: entry.entry_date || "",
    exercise_type: entry.exercise_type || "run",
    exercise_other: entry.exercise_other || "",
    duration_min: entry.duration_min ? String(entry.duration_min) : "",
    kcal: entry.kcal ? String(entry.kcal) : "",
    device: entry.device || "apple_watch",
    device_other: entry.device_other || "",
    photo_before_url: entry.photo_before_url || "",
    photo_after_url: entry.photo_after_url || "",
    notes: entry.notes || "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [topError, setTopError] = useState(null);

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  }

  function validate() {
    const e = {};
    if (!form.entry_date) e.entry_date = t("wc.log_err_date");
    if (form.exercise_type === "other" && !form.exercise_other.trim())
      e.exercise_other = t("wc.log_err_exercise_other");
    if (form.device === "other" && !form.device_other.trim())
      e.device_other = t("wc.log_err_device_other");
    const dur = Number(form.duration_min);
    if (!dur || dur <= 0 || dur > 120) e.duration_min = t("wc.log_err_duration");
    const k = Number(form.kcal);
    if (!k || k <= 0) e.kcal = t("wc.log_err_kcal");
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(ev) {
    ev.preventDefault();
    setTopError(null);
    if (!validate()) return;
    setSaving(true);
    try {
      await updateMyPendingEntry(userId, entry.id, form);
      onClose();
    } catch (err) {
      setTopError(err.message || String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <form
        onClick={(ev) => ev.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-2xl rounded-lg border border-arena-border bg-arena-surface p-5 sm:p-6 space-y-4 my-8"
      >
        <h2 className="font-display text-xl font-semibold">
          {t("wc.history_edit_title")}
        </h2>

        {topError && (
          <div className="rounded border border-arena-red/40 bg-arena-red/10 text-arena-red text-sm px-3 py-2">
            {topError}
          </div>
        )}

        <Field label={t("wc.log_field_date")} error={errors.entry_date}>
          <input
            type="date"
            value={form.entry_date}
            onChange={(e) => set("entry_date", e.target.value)}
            className="input"
          />
        </Field>

        <Field label={t("wc.log_field_exercise")}>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {EXERCISE_TYPES.map((ex) => (
              <button
                type="button"
                key={ex.id}
                onClick={() => set("exercise_type", ex.id)}
                className={`rounded border px-2 py-2 text-xs flex flex-col items-center gap-1 transition ${
                  form.exercise_type === ex.id
                    ? "border-arena-amber bg-arena-amber/10 text-arena-amber"
                    : "border-arena-border bg-arena-card text-arena-muted hover:text-arena-text"
                }`}
              >
                <span className="text-lg">{ex.icon}</span>
                <span className="leading-none">{t(`wc.ex_${ex.id}`)}</span>
              </button>
            ))}
          </div>
        </Field>

        {form.exercise_type === "other" && (
          <Field
            label={t("wc.log_field_exercise_other")}
            error={errors.exercise_other}
          >
            <input
              value={form.exercise_other}
              onChange={(e) => set("exercise_other", e.target.value)}
              placeholder={t("wc.log_ph_exercise_other")}
              className="input"
            />
          </Field>
        )}

        <div className="grid sm:grid-cols-3 gap-4">
          <Field label={t("wc.log_field_duration")} error={errors.duration_min}>
            <input
              type="number"
              min="1"
              max="120"
              value={form.duration_min}
              onChange={(e) => set("duration_min", e.target.value)}
              className="input"
            />
          </Field>
          <Field label={t("wc.log_field_kcal")} error={errors.kcal}>
            <input
              type="number"
              min="1"
              value={form.kcal}
              onChange={(e) => set("kcal", e.target.value)}
              className="input"
            />
          </Field>
          <Field label={t("wc.log_field_device")}>
            <select
              value={form.device}
              onChange={(e) => set("device", e.target.value)}
              className="input"
            >
              {DEVICES.map((d) => (
                <option key={d.id} value={d.id}>
                  {t(`wc.dev_${d.id}`)}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {form.device === "other" && (
          <Field
            label={t("wc.log_field_device_other")}
            error={errors.device_other}
          >
            <input
              value={form.device_other}
              onChange={(e) => set("device_other", e.target.value)}
              placeholder={t("wc.log_ph_device_other")}
              className="input"
            />
          </Field>
        )}

        <Field label={t("wc.log_field_photo_before")}>
          <input
            type="url"
            value={form.photo_before_url}
            onChange={(e) => set("photo_before_url", e.target.value)}
            placeholder="https://drive.google.com/…"
            className="input"
          />
        </Field>

        <Field label={t("wc.log_field_photo_after")}>
          <input
            type="url"
            value={form.photo_after_url}
            onChange={(e) => set("photo_after_url", e.target.value)}
            placeholder="https://drive.google.com/…"
            className="input"
          />
        </Field>

        <Field label={t("wc.log_field_notes")}>
          <input
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder={t("wc.log_ph_notes")}
            className="input"
          />
        </Field>

        <footer className="flex items-center justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs tracking-wide uppercase text-arena-muted hover:text-arena-text"
          >
            {t("wc.log_btn_cancel")}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-arena-amber text-arena-bg px-5 py-2.5 text-sm font-semibold tracking-wide uppercase hover:brightness-110 disabled:opacity-50"
          >
            {saving ? t("wc.log_btn_saving") : t("wc.log_btn_submit")}
          </button>
        </footer>
      </form>
    </div>
  );
}

function Field({ label, children, error }) {
  return (
    <label className="block">
      <span className="flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase text-arena-muted mb-2">
        {label}
      </span>
      {children}
      {error && (
        <span className="block mt-1 text-[11px] text-arena-red">{error}</span>
      )}
    </label>
  );
}

function PhotoChip({ url }) {
  if (!url) return <span className="text-arena-muted">—</span>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      title={url}
      className="inline-flex items-center justify-center w-8 h-8 rounded border border-arena-border hover:border-arena-amber hover:text-arena-amber text-arena-muted text-sm transition"
    >
      🔗
    </a>
  );
}

function StatusBadge({ status, t }) {
  const map = {
    approved: {
      label: t("wc.status_approved"),
      cls: "text-arena-green border-arena-green/30 bg-arena-green/10",
    },
    pending: {
      label: t("wc.status_pending"),
      cls: "text-arena-amber border-arena-amber/30 bg-arena-amber/10",
    },
    rejected: {
      label: t("wc.status_rejected"),
      cls: "text-arena-red border-arena-red/30 bg-arena-red/10",
    },
  };
  const m = map[status] || map.pending;
  return (
    <span
      className={`text-[10px] tracking-[0.15em] uppercase px-2 py-1 rounded border ${m.cls}`}
    >
      {m.label}
    </span>
  );
}
