import { Link } from "react-router-dom";
import { useT, formatNum } from "../../../lib/i18n";
import { PRIZES, WEEKLY_KPI } from "../lib/data";

function prizeAmountKey(id) {
  return id === "streak" ? "wc.prize_amount_streak" : "wc.prize_amount_monthly";
}

export default function Rules() {
  const { t, lang } = useT();
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header>
        <p className="text-[10px] tracking-[0.4em] uppercase text-arena-amber">
          {t("wc.rules_eyebrow")}
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold mt-2 leading-tight">
          {t("wc.rules_title")}
        </h1>
        <p className="text-sm text-arena-muted mt-3">
          {t("wc.rules_intro_a")}{" "}
          <span className="text-arena-text">{t("wc.rules_intro_name")}</span>{" "}
          {t("wc.rules_intro_b")}
        </p>
      </header>

      <Section icon="📅" title={t("wc.rules_sec_time")}>
        <p>{t("wc.rules_time_body")}</p>
      </Section>

      <Section icon="🏃" title={t("wc.rules_sec_form")}>
        <p>{t("wc.rules_form_body")}</p>
        <p className="text-arena-amber mt-2">{t("wc.rules_form_note")}</p>
      </Section>

      <Section icon="📊" title={t("wc.rules_sec_kpi")}>
        <div className="rounded-lg border border-arena-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-arena-card">
              <tr className="text-[10px] tracking-[0.2em] uppercase text-arena-muted">
                <th className="px-4 py-2 text-left">{t("wc.rules_kpi_col_gender")}</th>
                <th className="px-4 py-2 text-right">{t("wc.month_6")}</th>
                <th className="px-4 py-2 text-right">{t("wc.month_7")}</th>
                <th className="px-4 py-2 text-right">{t("wc.month_8")}</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              <Row gender={t("wc.gender_male")} map={WEEKLY_KPI.male} lang={lang} />
              <Row gender={t("wc.gender_female")} map={WEEKLY_KPI.female} lang={lang} />
            </tbody>
          </table>
        </div>
        <p className="text-xs text-arena-muted mt-2">{t("wc.rules_kpi_note")}</p>
      </Section>

      <Section icon="🗓️" title={t("wc.rules_sec_week")}>
        <ul className="space-y-1 list-disc pl-5 text-arena-text/90">
          <li>{t("wc.rules_week_buckets")}</li>
          <li>{t("wc.rules_week_leftover")}</li>
          <li>{t("wc.rules_week_month_truth")}</li>
        </ul>
      </Section>

      <Section icon="📸" title={t("wc.rules_sec_capture")}>
        <ul className="space-y-2">
          <Check>{t("wc.rules_capture_1")}</Check>
          <Check>{t("wc.rules_capture_2")}</Check>
          <Check>{t("wc.rules_capture_3")}</Check>
          <Check>{t("wc.rules_capture_4")}</Check>
        </ul>
      </Section>

      <Section icon="📷" title={t("wc.rules_sec_how_photo")}>
        <ol className="space-y-2 list-decimal pl-5 text-arena-text/90">
          <li>{t("wc.rules_how_1")}</li>
          <li>{t("wc.rules_how_2")}</li>
          <li>{t("wc.rules_how_3")}</li>
        </ol>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <img
            src="/wellness-challenge/example_1.png"
            alt="Example 1"
            className="w-full rounded-lg border border-arena-line"
          />
          <img
            src="/wellness-challenge/example_2.png"
            alt="Example 2"
            className="w-full rounded-lg border border-arena-line"
          />
        </div>
        <div className="mt-4 rounded-lg border border-arena-amber/30 bg-arena-amber/5 p-4 text-sm">
          <p className="font-semibold text-arena-amber mb-1">{t("wc.rules_example_title")}</p>
          <p>
            {t("wc.rules_example_body")}
            <span className="font-mono text-arena-text">
              {t("wc.rules_example_result")}
            </span>
          </p>
        </div>
      </Section>

      <Section icon="⚠️" title={t("wc.rules_sec_invalid")} tone="danger">
        <ul className="space-y-1 list-disc pl-5 text-arena-text/90">
          <li>{t("wc.rules_invalid_1")}</li>
          <li>{t("wc.rules_invalid_2")}</li>
          <li>{t("wc.rules_invalid_3")}</li>
        </ul>
      </Section>

      <Section icon="📤" title={t("wc.rules_sec_submit")}>
        <p>{t("wc.rules_submit_body")}</p>
        <p className="mt-3 font-semibold text-arena-text">{t("wc.rules_devices_title")}</p>
        <ul className="mt-2 space-y-1 list-disc pl-5">
          <li>{t("wc.rules_dev_1")}</li>
          <li>{t("wc.rules_dev_2")}</li>
          <li>{t("wc.rules_dev_3")}</li>
          <li>{t("wc.rules_dev_4")}</li>
        </ul>
      </Section>

      <Section icon="🏆" title={t("wc.rules_sec_prizes")}>
        <div className="grid sm:grid-cols-3 gap-3">
          {PRIZES.map((p) => (
            <div
              key={p.id}
              className="rounded border border-arena-border bg-arena-card p-4"
            >
              <div className="text-2xl">{p.icon}</div>
              <p className="mt-2 text-sm font-semibold">
                {t(`wc.prize_${p.id}`)}
              </p>
              <p className="text-xs text-arena-amber font-mono mt-2">
                {t(prizeAmountKey(p.id))}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <div className="flex items-center justify-between pt-4 border-t border-arena-border">
        <p className="text-sm text-arena-muted">{t("wc.rules_footer")}</p>
        <Link
          to="/wellness-challenge/log"
          className="rounded-md bg-arena-amber text-arena-bg px-4 py-2 text-xs font-semibold tracking-wide uppercase hover:brightness-110"
        >
          {t("wc.rules_cta")}
        </Link>
      </div>
    </div>
  );
}

function Section({ icon, title, tone, children }) {
  const ring =
    tone === "danger"
      ? "border-arena-red/30"
      : "border-arena-border";
  return (
    <section className={`rounded-lg border ${ring} bg-arena-surface p-5 sm:p-6`}>
      <h2 className="flex items-center gap-2 text-base font-semibold">
        <span className="text-xl">{icon}</span>
        <span>{title}</span>
      </h2>
      <div className="mt-3 text-sm text-arena-text/85 leading-relaxed space-y-1">
        {children}
      </div>
    </section>
  );
}

function Row({ gender, map, lang }) {
  return (
    <tr className="border-t border-arena-border">
      <td className="px-4 py-2 font-sans text-arena-muted">{gender}</td>
      <td className="px-4 py-2 text-right">{formatNum(map[6], lang)}</td>
      <td className="px-4 py-2 text-right text-arena-amber">
        {formatNum(map[7], lang)}
      </td>
      <td className="px-4 py-2 text-right text-arena-amber font-semibold">
        {formatNum(map[8], lang)}
      </td>
    </tr>
  );
}

function Check({ children }) {
  return (
    <li className="flex gap-2 items-start">
      <span className="text-arena-green mt-0.5">✓</span>
      <span>{children}</span>
    </li>
  );
}
