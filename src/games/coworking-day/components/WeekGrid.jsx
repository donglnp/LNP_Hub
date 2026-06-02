import { weekdayLabel, formatDayShort, toISODate, isSameDay } from "../lib/dates";
import { useT } from "../../../lib/i18n";

export default function WeekGrid({ weeks, attendanceByDate, profiles, currentUserId, today, onPickDay }) {
  const { lang, t } = useT();

  return (
    <div className="space-y-6">
      {weeks.map((week, wi) => (
        <div key={wi}>
          <h3 className="text-[10px] tracking-[0.4em] uppercase text-arena-muted font-semibold mb-3">
            {wi === 0 ? t("coworking.this_week") : t("coworking.next_week")}
          </h3>
          <div className="grid grid-cols-5 gap-2 sm:gap-3">
            {week.map((day) => {
              const iso = toISODate(day);
              const wd = day.getDay() === 0 ? 7 : day.getDay();
              const attendees = attendanceByDate[iso] || [];
              const isToday = isSameDay(day, today);
              const isPast = day < today && !isToday;
              const youJoined = attendees.some((a) => a.user_id === currentUserId);
              return (
                <button
                  key={iso}
                  onClick={() => !isPast && onPickDay(iso, day)}
                  disabled={isPast}
                  className={[
                    "group relative flex flex-col rounded-lg border p-2 sm:p-3 text-left transition min-h-[110px]",
                    isPast
                      ? "border-arena-border/40 bg-arena-card/40 opacity-50 cursor-not-allowed"
                      : isToday
                      ? "border-arena-blue/60 bg-arena-blue/5 hover:bg-arena-blue/10"
                      : "border-arena-border bg-arena-card hover:border-arena-blue/40",
                    youJoined ? "ring-1 ring-arena-blue/60" : "",
                  ].join(" ")}
                >
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-[10px] uppercase tracking-wider text-arena-muted font-semibold">
                      {weekdayLabel(wd, lang)}
                    </span>
                    <span className="text-xs text-arena-text font-bold">
                      {formatDayShort(day, lang)}
                    </span>
                  </div>

                  {attendees.length === 0 ? (
                    <span className="text-[10px] text-arena-muted italic mt-auto">
                      {t("coworking.empty_day")}
                    </span>
                  ) : (
                    <div className="mt-auto">
                      <div className="flex flex-wrap gap-1 mb-1">
                        {attendees.slice(0, 5).map((a) => {
                          const p = profiles[a.user_id];
                          return (
                            <div
                              key={a.user_id}
                              title={p?.full_name || ""}
                              className={[
                                "w-7 h-7 rounded-full border overflow-hidden shrink-0",
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
                                <div className="w-full h-full bg-arena-surface grid place-items-center text-[10px] font-bold">
                                  {p?.full_name?.charAt(0) || "?"}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {attendees.length > 5 && (
                          <div className="w-7 h-7 rounded-full bg-arena-surface border border-arena-border grid place-items-center text-[10px] font-bold text-arena-muted">
                            +{attendees.length - 5}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-arena-muted">
                        {t("coworking.count_people", { n: attendees.length })}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
