import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../lib/AuthContext";
import { useT } from "../../../lib/i18n";
import { createMyEntry, fetchMyLastEntry } from "../lib/wellness";
import { DEVICES, EXERCISE_TYPES, programState } from "../lib/data";

export default function Log() {
  const { user, profile } = useAuth();
  const { t } = useT();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    entry_date: new Date().toISOString().slice(0, 10),
    exercise_type: "run",
    exercise_other: "",
    duration_min: "",
    kcal: "",
    device: "apple_watch",
    device_other: "",
    photo_before_url: "",
    photo_after_url: "",
    notes: "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [topError, setTopError] = useState(null);
  const [showUploadHelp, setShowUploadHelp] = useState(false);
  const [prefilled, setPrefilled] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    fetchMyLastEntry(user.id).then((last) => {
      if (cancelled || !last) return;
      setForm((f) => ({
        ...f,
        exercise_type: last.exercise_type || f.exercise_type,
        exercise_other: last.exercise_other || "",
        duration_min: last.duration_min ? String(last.duration_min) : "",
        kcal: last.kcal ? String(last.kcal) : "",
        device: last.device || f.device,
        device_other: last.device_other || "",
      }));
      setPrefilled(true);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  }

  if (!profile?.joined_wellness) {
    return (
      <EmptyState
        icon="🌿"
        title={t("wc.empty_not_joined_title")}
        sub={t("wc.empty_not_joined_sub")}
      />
    );
  }
  if (programState() === "ended") {
    return (
      <EmptyState
        icon="🏁"
        title={t("wc.empty_ended_title")}
        sub={t("wc.empty_ended_sub")}
      />
    );
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
      await createMyEntry(user.id, form);
      navigate("/wellness-challenge/history");
    } catch (e) {
      if (e?.code === "DUPLICATE_DAY") {
        setTopError(t("wc.log_err_duplicate_day"));
      } else {
        setTopError(e.message || String(e));
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <header>
        <p className="text-[10px] tracking-[0.4em] uppercase text-arena-amber">
          {t("wc.log_eyebrow")}
        </p>
        <h1 className="font-display text-3xl font-semibold mt-2">
          {t("wc.log_title")}
        </h1>
        <p className="text-sm text-arena-muted mt-2">{t("wc.log_subtitle")}</p>
      </header>

      <form
        onSubmit={submit}
        className="rounded-lg border border-arena-border bg-arena-surface p-5 sm:p-6 space-y-4"
      >
        {topError && (
          <div className="rounded border border-arena-red/40 bg-arena-red/10 text-arena-red text-sm px-3 py-2">
            {topError}
          </div>
        )}

        {prefilled && (
          <div className="rounded border border-arena-amber/30 bg-arena-amber/10 text-arena-amber text-xs px-3 py-2">
            {t("wc.log_prefilled_hint")}
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

        <Field
          label={t("wc.log_field_photo_before")}
          onHelp={() => setShowUploadHelp(true)}
        >
          <input
            type="url"
            value={form.photo_before_url}
            onChange={(e) => set("photo_before_url", e.target.value)}
            placeholder="https://drive.google.com/…"
            className="input"
          />
        </Field>

        <Field
          label={t("wc.log_field_photo_after")}
          onHelp={() => setShowUploadHelp(true)}
        >
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

        <p className="text-[11px] text-arena-muted">{t("wc.log_pending_hint")}</p>

        <footer className="flex items-center justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={() => navigate(-1)}
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
      {showUploadHelp && (
        <UploadHelpModal onClose={() => setShowUploadHelp(false)} />
      )}
    </div>
  );
}

function Field({ label, children, error, onHelp }) {
  return (
    <label className="block">
      <span className="flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase text-arena-muted mb-2">
        {label}
        {onHelp && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onHelp();
            }}
            className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-arena-border text-[10px] text-arena-muted hover:text-arena-text hover:border-arena-text"
            aria-label="Help"
          >
            ?
          </button>
        )}
      </span>
      {children}
      {error && (
        <span className="block mt-1 text-[11px] text-arena-red">{error}</span>
      )}
    </label>
  );
}

function UploadHelpModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border border-arena-border bg-arena-surface p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-xl font-semibold mb-3">
          Hướng dẫn upload hình lên Google Drive
        </h2>
        <ol className="text-sm text-arena-muted space-y-2 list-decimal list-inside">
          <li>
            Mở{" "}
            <a
              href="https://drive.google.com"
              target="_blank"
              rel="noreferrer"
              className="text-arena-amber hover:underline"
            >
              drive.google.com
            </a>{" "}
            và đăng nhập bằng tài khoản Google của bạn.
          </li>
          <li>
            Bấm <span className="text-arena-text">Mới → Tải tệp lên</span> và
            chọn ảnh cần upload.
          </li>
          <li>
            Sau khi tải xong, chuột phải vào ảnh →{" "}
            <span className="text-arena-text">Chia sẻ</span>.
          </li>
          <li>
            Trong mục <span className="text-arena-text">Quyền truy cập chung</span>,
            đổi sang <span className="text-arena-text">Bất kỳ ai có đường liên kết</span>.
          </li>
          <li>
            Bấm <span className="text-arena-text">Sao chép đường liên kết</span>{" "}
            rồi dán vào ô nhập ở đây.
          </li>
        </ol>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-primary"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon, title, sub }) {
  return (
    <div className="rounded-lg border border-arena-border bg-arena-surface p-10 sm:p-14 text-center">
      <div className="text-5xl">{icon}</div>
      <h1 className="mt-4 font-display text-2xl sm:text-3xl font-semibold">
        {title}
      </h1>
      <p className="mt-3 text-sm text-arena-muted max-w-md mx-auto">{sub}</p>
    </div>
  );
}
