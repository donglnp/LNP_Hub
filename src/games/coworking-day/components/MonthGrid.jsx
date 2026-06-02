import { weekdayLabel, formatDayShort, toISODate, isSameDay, monthLabel } from "../lib/dates";
import { useT } from "../../../lib/i18n";

export default function MonthGrid({
  year,
  month,
  weeks,
  attendanceByDate,
  profiles,
  currentUserId,
  today,
  onPickDay,
  onPrev,
  onNext,
  canGoPrev,
  navBusy,
}) {
  const { lang, t } = useT();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onPrev}
          disabled={!canGoPrev || navBusy}
          className="px-3 py-1.5 rounded-md text-xs font-semibold border border-arena-border bg-arena-card text-arena-text hover:border-arena-blue/60 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ← {t("coworking.prev_month")}
        </button>
        <h3 className="font-display text-lg sm:text-xl font-semibold text-arena-text">
          {monthLabel(month, year, lang)}
        </h3>
        <button
          onClick={onNext}
          disabled={navBusy}
          className="px-3 py-1.5 rounded-md text-xs font-semibold border border-arena-border bg-arena-card text-arena-text hover:border-arena-blue/60 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {t("coworking.next_month")} →
        </button>
      </div>

      <div className="grid grid-cols-5 gap-1.5 sm:gap-2 mb-2">
        {[1, 2, 3, 4, 5].map((wd) => (
          <div
            key={wd}
            className="text-center text-[10px] uppercase tracking-wider text-arena-muted font-semibold py-1"
          >
            {weekdayLabel(wd, lang)}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {weeks.flat().map((cell, i) => {
          const { date, inMonth } = cell;
          const iso = toISODate(date);
          const attendees = attendanceByDate[iso] || [];
          const isToday = isSameDay(date, today);
          const isPast = date < today && !isToday;
          const disabled = !inMonth || isPast;
          const youJoined = attendees.some((a) => a.user_id === currentUserId);

          return (
            <button
              key={i}
              onClick={() => !disabled && onPickDay(iso, date)}
              disabled={disabled}
              className={[
                "relative flex flex-col rounded-md border p-1.5 sm:p-2 text-left transition min-h-[88px] sm:min-h-[100px]",
                !inMonth
                  ? "border-transparent bg-transparent opacity-0 pointer-events-none"
                  : isPast
                  ? "border-arena-border/40 bg-arena-card/40 opacity-50 cursor-not-allowed"
                  : isToday
                  ? "border-arena-blue/60 bg-arena-blue/5 hover:bg-arena-blue/10"
                  : "border-arena-border bg-arena-card hover:border-arena-blue/40",
                youJoined && inMonth ? "ring-1 ring-arena-blue/60" : "",
              ].join(" ")}
            >
              {inMonth && (
                <>
                  <div className="flex items-baseline justify-between mb-1">
                    <span
                      className={[
                        "text-xs font-bold",
                        isToday ? "text-arena-blue" : "text-arena-text",
                      ].join(" ")}
                    >
                      {formatDayShort(date, lang)}
                    </span>
                    {attendees.length > 0 && (
                      <span className="text-[10px] text-arena-muted font-semibold">
                        {attendees.length}
                      </span>
                    )}
                  </div>

                  {attendees.length > 0 && (
                    <div className="mt-auto flex flex-wrap gap-0.5">
                      {attendees.slice(0, 4).map((a) => {
                        const p = profiles[a.user_id];
                        return (
                          <div
                            key={a.user_id}
                            title={p?.full_name || ""}
                            className={[
                              "w-5 h-5 sm:w-6 sm:h-6 rounded-full border overflow-hidden shrink-0",
                              a.user_id === currentUserId
                                ? "border-arena-blue"
                                : "border-arena-border",
                            ].join(" ")}
                          >
                            {p?.avatar_url ? (
                              <img
                                src={p.avatar_url}
                                alt=""
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-full h-full bg-arena-surface grid place-items-center text-[9px] font-bold">
                                {p?.full_name?.charAt(0) || "?"}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {attendees.length > 4 && (
                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-arena-surface border border-arena-border grid place-items-center text-[9px] font-bold text-arena-muted">
                          +{attendees.length - 4}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
