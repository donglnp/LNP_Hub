import { useEffect } from "react";
import { useT } from "../../../lib/i18n";
import { formatDayShort, weekdayLabel } from "../lib/dates";

export default function DayDetailModal({ open, isoDate, date, attendees, profiles, currentUserId, onClose, onToggle, busy }) {
  const { t, lang } = useT();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !date) return null;

  const wd = date.getDay() === 0 ? 7 : date.getDay();
  const youJoined = attendees.some((a) => a.user_id === currentUserId);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-arena-border bg-arena-surface p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-arena-blue font-semibold">
              {weekdayLabel(wd, lang)}
            </p>
            <h2 className="font-display text-2xl font-bold text-arena-text mt-1">
              {formatDayShort(date, lang)}
            </h2>
            <p className="text-xs text-arena-muted mt-1">
              {t("coworking.count_people", { n: attendees.length })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-arena-muted hover:text-arena-text text-xl leading-none px-2"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {attendees.length === 0 ? (
          <p className="text-xs text-arena-muted italic py-4 text-center">
            {t("coworking.empty_day_long")}
          </p>
        ) : (
          <ul className="space-y-2 max-h-[280px] overflow-y-auto mb-5 pr-1">
            {attendees.map((a) => {
              const p = profiles[a.user_id];
              if (!p) return null;
              const isMe = a.user_id === currentUserId;
              return (
                <li
                  key={a.user_id}
                  className="flex items-center gap-3 rounded border border-arena-border bg-arena-card px-3 py-2"
                >
                  <div className="w-9 h-9 rounded-full border border-arena-border overflow-hidden shrink-0">
                    {p.avatar_url ? (
                      <img
                        src={p.avatar_url}
                        alt=""
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-arena-surface grid place-items-center text-xs font-bold">
                        {p.full_name?.charAt(0) || "?"}
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-medium text-arena-text truncate flex-1">
                    {p.full_name}
                    {isMe && (
                      <span className="ml-2 text-[10px] uppercase tracking-wider text-arena-blue font-bold">
                        {t("common.you")}
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        <button
          onClick={() => onToggle(isoDate)}
          disabled={busy}
          className={[
            "w-full px-4 py-3 rounded-md font-semibold text-sm tracking-wide transition disabled:opacity-50",
            youJoined
              ? "border border-arena-border bg-arena-card text-arena-text hover:border-arena-red hover:text-arena-red"
              : "bg-arena-blue text-arena-bg hover:brightness-110",
          ].join(" ")}
        >
          {busy
            ? t("common.saving")
            : youJoined
            ? t("coworking.btn_leave")
            : t("coworking.btn_join")}
        </button>
      </div>
    </div>
  );
}
